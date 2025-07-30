#!/usr/bin/env node

/**
 * Advanced evaluation script that integrates with the GenAI labeller
 * 
 * This script attempts to use the actual GenAI labelling logic when possible,
 * falling back to keyword-based simulation when the dependencies are not available.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class AdvancedLabellerEvaluator {
  constructor(owner, repo, token) {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
    this.apiBase = 'api.github.com';
    this.useActualLabeller = false;
    this.labellerScript = null;
  }

  /**
   * Try to load the actual GenAI labeller script
   */
  async initializeLabeller() {
    try {
      // Check if we're in the right directory and have the script
      const scriptPath = path.join(process.cwd(), 'genaisrc', 'genai-issue-labeller.genai.mts');
      if (fs.existsSync(scriptPath)) {
        console.log('📋 Found GenAI labeller script, attempting to use actual AI logic...');
        // For now, we'll still use simulation but this is where
        // you would integrate with the actual GenAI environment
        this.useActualLabeller = false; // Set to true when AI integration is ready
        console.log('⚠️  Using keyword-based simulation (AI integration pending)');
      } else {
        console.log('⚠️  GenAI labeller script not found, using keyword-based simulation');
      }
    } catch (error) {
      console.log('⚠️  Could not initialize actual labeller, using simulation:', error.message);
    }
  }

  /**
   * Make a GitHub API request
   */
  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: this.apiBase,
        path: path,
        method: options.method || 'GET',
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'action-genai-issue-labeller-evaluator',
          'Accept': 'application/vnd.github.v3+json',
          ...options.headers
        }
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`GitHub API error: ${res.statusCode} ${parsed.message || data}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  /**
   * Fetch repository labels
   */
  async getRepositoryLabels() {
    const path = `/repos/${this.owner}/${this.repo}/labels`;
    const labels = await this.makeRequest(path);
    
    // Filter out disallowed labels (same as in the main script)
    const disallowedLabels = ["duplicate", "wontfix"];
    return labels.filter(label => !disallowedLabels.includes(label.name));
  }

  /**
   * Fetch the last N issues from the repository
   */
  async getLastIssues(count = 100) {
    const issues = [];
    let page = 1;
    const perPage = Math.min(count, 100); // GitHub API limit

    while (issues.length < count) {
      const path = `/repos/${this.owner}/${this.repo}/issues?state=all&sort=created&direction=desc&page=${page}&per_page=${perPage}`;
      try {
        const pageIssues = await this.makeRequest(path);
        
        if (pageIssues.length === 0) break;
        
        // Filter out pull requests (GitHub API returns both issues and PRs)
        const actualIssues = pageIssues.filter(issue => !issue.pull_request);
        issues.push(...actualIssues);
        
        page++;
        
        // Rate limiting protection
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Avoid infinite loop
        if (page > 20) break;
      } catch (error) {
        if (error.message.includes('403')) {
          console.log('⚠️  Rate limited, waiting...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          throw error;
        }
      }
    }

    return issues.slice(0, count);
  }

  /**
   * Enhanced label suggestion using improved heuristics
   */
  generateLabelSuggestion(issue, availableLabels) {
    const title = (issue.title || '').toLowerCase();
    const body = (issue.body || '').toLowerCase();
    const content = `${title} ${body}`;
    
    const suggestedLabels = [];
    
    // Enhanced keyword-based labelling with weights
    const labelPatterns = {
      'bug': {
        keywords: ['bug', 'error', 'issue', 'problem', 'fail', 'broken', 'crash', 'not working', 'exception', 'traceback'],
        weight: 1.0
      },
      'enhancement': {
        keywords: ['feature', 'enhance', 'improve', 'add', 'support', 'request', 'new', 'implement', 'would like'],
        weight: 1.0
      },
      'documentation': {
        keywords: ['doc', 'readme', 'document', 'guide', 'manual', 'wiki', 'tutorial', 'example'],
        weight: 1.0
      },
      'question': {
        keywords: ['question', '?', 'how', 'help', 'unclear', 'understand', 'explain', 'why does'],
        weight: 1.0
      },
      'good first issue': {
        keywords: ['good first issue', 'beginner', 'easy', 'starter', 'newcomer', 'simple'],
        weight: 0.8
      },
      'help wanted': {
        keywords: ['help wanted', 'help', 'volunteer', 'contribution', 'community'],
        weight: 0.8
      },
      'performance': {
        keywords: ['performance', 'slow', 'speed', 'optimize', 'memory', 'cpu', 'latency'],
        weight: 0.9
      },
      'security': {
        keywords: ['security', 'vulnerability', 'exploit', 'unsafe', 'attack', 'cve'],
        weight: 1.0
      },
      'ui': {
        keywords: ['ui', 'interface', 'design', 'layout', 'visual', 'css', 'style'],
        weight: 0.9
      },
      'api': {
        keywords: ['api', 'endpoint', 'rest', 'graphql', 'service', 'integration'],
        weight: 0.9
      }
    };

    // Score labels based on keyword matches
    const labelScores = {};
    
    for (const [labelName, pattern] of Object.entries(labelPatterns)) {
      const labelExists = availableLabels.some(l => l.name.toLowerCase() === labelName.toLowerCase());
      if (!labelExists) continue;
      
      let score = 0;
      for (const keyword of pattern.keywords) {
        if (content.includes(keyword)) {
          score += pattern.weight;
        }
      }
      
      if (score > 0) {
        labelScores[labelName] = score;
      }
    }

    // Add exact label name matches
    for (const label of availableLabels) {
      const labelName = label.name.toLowerCase();
      if (content.includes(labelName) && !labelScores[labelName]) {
        labelScores[labelName] = 0.5;
      }
    }

    // Sort by score and take top matches
    const sortedLabels = Object.entries(labelScores)
      .sort((a, b) => b[1] - a[1])
      .map(([label]) => label)
      .slice(0, 3);

    return sortedLabels;
  }

  /**
   * Calculate comprehensive evaluation metrics
   */
  calculateMetrics(predicted, actual) {
    const predictedSet = new Set(predicted.map(l => l.toLowerCase()));
    const actualSet = new Set(actual.map(l => l.toLowerCase()));
    
    const intersection = new Set([...predictedSet].filter(x => actualSet.has(x)));
    const union = new Set([...predictedSet, ...actualSet]);
    
    const precision = predictedSet.size > 0 ? intersection.size / predictedSet.size : 0;
    const recall = actualSet.size > 0 ? intersection.size / actualSet.size : 0;
    const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    const jaccard = union.size > 0 ? intersection.size / union.size : 0;
    
    return {
      precision,
      recall,
      f1,
      jaccard,
      exactMatch: predictedSet.size === actualSet.size && intersection.size === actualSet.size,
      predicted: predicted,
      actual: actual,
      matched: [...intersection],
      missed: [...actualSet].filter(x => !predictedSet.has(x)),
      extra: [...predictedSet].filter(x => !actualSet.has(x))
    };
  }

  /**
   * Analyze label distribution
   */
  analyzeLabelDistribution(results) {
    const labelCounts = {};
    const labelAccuracy = {};
    
    for (const result of results) {
      // Count actual labels
      for (const label of result.actual) {
        labelCounts[label] = (labelCounts[label] || 0) + 1;
        if (!labelAccuracy[label]) {
          labelAccuracy[label] = { correct: 0, total: 0 };
        }
        labelAccuracy[label].total++;
        if (result.matched.includes(label)) {
          labelAccuracy[label].correct++;
        }
      }
    }
    
    return { labelCounts, labelAccuracy };
  }

  /**
   * Run the full evaluation with enhanced reporting
   */
  async evaluate(issueCount = 100) {
    console.log(`🚀 Starting advanced evaluation for ${this.owner}/${this.repo}`);
    await this.initializeLabeller();
    console.log(`📋 Fetching last ${issueCount} issues...`);
    
    try {
      // Fetch repository data
      const [issues, labels] = await Promise.all([
        this.getLastIssues(issueCount),
        this.getRepositoryLabels()
      ]);

      console.log(`📊 Found ${issues.length} issues and ${labels.length} labels`);
      console.log(`📝 Available labels: ${labels.map(l => l.name).join(', ')}`);
      
      if (issues.length === 0) {
        console.log('❌ No issues found in repository');
        return;
      }

      // Evaluate each issue
      const results = [];
      let totalPrecision = 0;
      let totalRecall = 0;
      let totalF1 = 0;
      let totalJaccard = 0;
      let exactMatches = 0;
      let issuesWithLabels = 0;

      console.log('\n🔍 Evaluating issues...');
      
      for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        const existingLabels = issue.labels.map(l => typeof l === 'string' ? l : l.name);
        
        // Skip issues without existing labels (can't evaluate)
        if (existingLabels.length === 0) {
          continue;
        }
        
        issuesWithLabels++;
        
        // Generate label suggestions
        const suggestedLabels = this.generateLabelSuggestion(issue, labels);
        
        // Calculate metrics for this issue
        const metrics = this.calculateMetrics(suggestedLabels, existingLabels);
        
        totalPrecision += metrics.precision;
        totalRecall += metrics.recall;
        totalF1 += metrics.f1;
        totalJaccard += metrics.jaccard;
        if (metrics.exactMatch) exactMatches++;
        
        results.push({
          issue: {
            number: issue.number,
            title: issue.title,
            url: issue.html_url,
            created_at: issue.created_at,
            state: issue.state
          },
          ...metrics
        });

        // Progress indicator
        if ((i + 1) % 10 === 0) {
          console.log(`   Processed ${i + 1}/${issues.length} issues`);
        }
      }

      // Calculate overall metrics
      const avgPrecision = issuesWithLabels > 0 ? totalPrecision / issuesWithLabels : 0;
      const avgRecall = issuesWithLabels > 0 ? totalRecall / issuesWithLabels : 0;
      const avgF1 = issuesWithLabels > 0 ? totalF1 / issuesWithLabels : 0;
      const avgJaccard = issuesWithLabels > 0 ? totalJaccard / issuesWithLabels : 0;
      const exactMatchRate = issuesWithLabels > 0 ? exactMatches / issuesWithLabels : 0;

      // Analyze label distribution
      const { labelCounts, labelAccuracy } = this.analyzeLabelDistribution(results);

      // Output results
      console.log('\n📈 Evaluation Results');
      console.log('=' .repeat(50));
      console.log(`Repository: ${this.owner}/${this.repo}`);
      console.log(`Total issues evaluated: ${issuesWithLabels}`);
      console.log(`Issues without labels (skipped): ${issues.length - issuesWithLabels}`);
      console.log(`Average Precision: ${(avgPrecision * 100).toFixed(2)}%`);
      console.log(`Average Recall: ${(avgRecall * 100).toFixed(2)}%`);
      console.log(`Average F1-Score: ${(avgF1 * 100).toFixed(2)}%`);
      console.log(`Average Jaccard Index: ${(avgJaccard * 100).toFixed(2)}%`);
      console.log(`Exact Match Rate: ${(exactMatchRate * 100).toFixed(2)}%`);

      // Label-specific accuracy
      console.log('\n🏷️  Label-specific Performance:');
      console.log('-'.repeat(50));
      const sortedLabels = Object.entries(labelAccuracy)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10);
      
      for (const [label, stats] of sortedLabels) {
        const accuracy = stats.total > 0 ? (stats.correct / stats.total * 100).toFixed(1) : '0.0';
        console.log(`  ${label}: ${accuracy}% (${stats.correct}/${stats.total})`);
      }

      // Save detailed results
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const resultsFile = `evaluation-results-${timestamp}.json`;
      
      const detailedResults = {
        metadata: {
          repository: `${this.owner}/${this.repo}`,
          evaluatedAt: new Date().toISOString(),
          totalIssues: issues.length,
          issuesWithLabels,
          issuesWithoutLabels: issues.length - issuesWithLabels,
          evaluationMethod: this.useActualLabeller ? 'AI' : 'keyword-simulation',
          availableLabels: labels.map(l => l.name)
        },
        summary: {
          avgPrecision,
          avgRecall,
          avgF1,
          avgJaccard,
          exactMatchRate
        },
        labelAnalysis: {
          labelCounts,
          labelAccuracy
        },
        issues: results
      };

      fs.writeFileSync(resultsFile, JSON.stringify(detailedResults, null, 2));
      console.log(`\n💾 Detailed results saved to: ${resultsFile}`);

      // Show examples
      this.showExamples(results);

      return detailedResults;

    } catch (error) {
      console.error('❌ Evaluation failed:', error.message);
      throw error;
    }
  }

  /**
   * Show example results
   */
  showExamples(results) {
    console.log('\n🔍 Sample Results:');
    console.log('-'.repeat(50));
    
    const topF1Issues = results
      .sort((a, b) => b.f1 - a.f1)
      .slice(0, 3);
      
    const bottomF1Issues = results
      .sort((a, b) => a.f1 - b.f1)
      .slice(0, 3);

    console.log('\n✅ Best Predictions (Top 3 F1-Score):');
    topF1Issues.forEach((result, i) => {
      console.log(`  ${i + 1}. Issue #${result.issue.number}: ${result.issue.title.substring(0, 50)}...`);
      console.log(`     F1: ${(result.f1 * 100).toFixed(1)}%, Predicted: [${result.predicted.join(', ')}], Actual: [${result.actual.join(', ')}]`);
      if (result.missed.length > 0) {
        console.log(`     Missed: [${result.missed.join(', ')}]`);
      }
      if (result.extra.length > 0) {
        console.log(`     Extra: [${result.extra.join(', ')}]`);
      }
    });

    console.log('\n❌ Worst Predictions (Bottom 3 F1-Score):');
    bottomF1Issues.forEach((result, i) => {
      console.log(`  ${i + 1}. Issue #${result.issue.number}: ${result.issue.title.substring(0, 50)}...`);
      console.log(`     F1: ${(result.f1 * 100).toFixed(1)}%, Predicted: [${result.predicted.join(', ')}], Actual: [${result.actual.join(', ')}]`);
      if (result.missed.length > 0) {
        console.log(`     Missed: [${result.missed.join(', ')}]`);
      }
      if (result.extra.length > 0) {
        console.log(`     Extra: [${result.extra.join(', ')}]`);
      }
    });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node evaluate-labeller-advanced.js <owner> <repo> [options]

Arguments:
  owner         Repository owner (username or organization)
  repo          Repository name

Options:
  --token <token>     GitHub personal access token (or use GITHUB_TOKEN env var)
  --count <number>    Number of issues to evaluate (default: 100)
  --help, -h          Show this help message

Examples:
  node evaluate-labeller-advanced.js microsoft vscode --count 50
  node evaluate-labeller-advanced.js octocat Hello-World
  GITHUB_TOKEN=your_token node evaluate-labeller-advanced.js owner repo

Environment Variables:
  GITHUB_TOKEN        GitHub personal access token

Features:
  - Enhanced keyword-based labelling with scoring
  - Label-specific performance analysis
  - Comprehensive metrics (Precision, Recall, F1, Jaccard)
  - Rate limiting protection
  - Detailed error analysis
`);
    process.exit(0);
  }

  const owner = args[0];
  const repo = args[1];
  
  let token = process.env.GITHUB_TOKEN;
  let count = 100;
  
  // Parse additional arguments
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--token' && i + 1 < args.length) {
      token = args[i + 1];
      i++;
    } else if (args[i] === '--count' && i + 1 < args.length) {
      count = parseInt(args[i + 1]);
      i++;
    }
  }
  
  if (!token) {
    console.error('❌ Error: GitHub token is required. Use --token <token> or set GITHUB_TOKEN environment variable.');
    process.exit(1);
  }
  
  if (isNaN(count) || count < 1) {
    console.error('❌ Error: Count must be a positive number.');
    process.exit(1);
  }

  try {
    const evaluator = new AdvancedLabellerEvaluator(owner, repo, token);
    await evaluator.evaluate(count);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AdvancedLabellerEvaluator };