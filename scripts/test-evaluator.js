#!/usr/bin/env node

/**
 * Test script for the labeller evaluator
 * This script tests the evaluation logic with mock data
 */

const { LabellerEvaluator } = require('./evaluate-labeller.js');

// Mock GitHub API responses for testing
class MockLabellerEvaluator extends LabellerEvaluator {
  constructor() {
    super('test-owner', 'test-repo', 'mock-token');
  }

  async makeRequest(path) {
    // Mock repository labels
    if (path.includes('/labels')) {
      return [
        { name: 'bug', description: 'Something is not working' },
        { name: 'enhancement', description: 'New feature or request' },
        { name: 'documentation', description: 'Improvements or additions to documentation' },
        { name: 'question', description: 'Further information is requested' },
        { name: 'good first issue', description: 'Good for newcomers' },
        { name: 'help wanted', description: 'Extra attention is needed' },
        { name: 'invalid', description: 'This does not seem right' }
      ];
    }
    
    // Mock issues
    if (path.includes('/issues')) {
      return [
        {
          number: 1,
          title: 'Bug: Application crashes when opening file',
          body: 'The application crashes every time I try to open a large file. This is a serious bug.',
          html_url: 'https://github.com/test-owner/test-repo/issues/1',
          labels: [{ name: 'bug' }],
          pull_request: null
        },
        {
          number: 2,
          title: 'Feature Request: Add dark mode support',
          body: 'It would be great to have dark mode support for better user experience. This enhancement would improve accessibility.',
          html_url: 'https://github.com/test-owner/test-repo/issues/2',
          labels: [{ name: 'enhancement' }],
          pull_request: null
        },
        {
          number: 3,
          title: 'Documentation: Update README with installation instructions',
          body: 'The README file needs to be updated with clear installation instructions and usage examples.',
          html_url: 'https://github.com/test-owner/test-repo/issues/3',
          labels: [{ name: 'documentation' }],
          pull_request: null
        },
        {
          number: 4,
          title: 'Question: How to configure the API key?',
          body: 'I need help understanding how to properly configure the API key. The documentation is unclear.',
          html_url: 'https://github.com/test-owner/test-repo/issues/4',
          labels: [{ name: 'question' }],
          pull_request: null
        },
        {
          number: 5,
          title: 'Issue with multiple labels',
          body: 'This issue has multiple aspects - it is a bug that needs documentation. There is an error in the code and the docs need updating.',
          html_url: 'https://github.com/test-owner/test-repo/issues/5',
          labels: [{ name: 'bug' }, { name: 'documentation' }],
          pull_request: null
        }
      ];
    }
    
    return [];
  }
}

async function runTest() {
  console.log('🧪 Running test evaluation with mock data...\n');
  
  try {
    const evaluator = new MockLabellerEvaluator();
    const results = await evaluator.evaluate(5);
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📊 Test Results Summary:');
    console.log(`- Repository: ${results.metadata.repository}`);
    console.log(`- Issues evaluated: ${results.metadata.issuesWithLabels}`);
    console.log(`- Average Precision: ${(results.summary.avgPrecision * 100).toFixed(2)}%`);
    console.log(`- Average Recall: ${(results.summary.avgRecall * 100).toFixed(2)}%`);
    console.log(`- Average F1-Score: ${(results.summary.avgF1 * 100).toFixed(2)}%`);
    console.log(`- Exact Match Rate: ${(results.summary.exactMatchRate * 100).toFixed(2)}%`);
    
    // Clean up test results file
    const fs = require('fs');
    const testFiles = fs.readdirSync('.').filter(f => f.startsWith('evaluation-results-'));
    testFiles.forEach(file => {
      fs.unlinkSync(file);
      console.log(`🗑️  Cleaned up test file: ${file}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runTest();
}