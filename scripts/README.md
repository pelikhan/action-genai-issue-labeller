# Labeller Evaluation Scripts

This directory contains scripts for evaluating the accuracy of the GenAI Issue Labeller action.

## Scripts Overview

### evaluate-labeller.js (Basic Version)

A simple Node.js script that provides basic evaluation functionality with keyword-based simulation.

### evaluate-labeller-advanced.js (Enhanced Version)

An enhanced evaluation script with improved features:
- Better keyword matching with scoring
- Label-specific performance analysis
- More comprehensive metrics (Jaccard index)
- Rate limiting protection
- Detailed error analysis
- Future-ready for AI integration

### test-evaluator.js

Test script that runs evaluation with mock data to verify functionality.

## Usage

### Basic Evaluation

```bash
# Basic evaluation
node scripts/evaluate-labeller.js <owner> <repo> --count 100

# Using npm script
npm run evaluate <owner> <repo> -- --count 100
```

### Advanced Evaluation (Recommended)

```bash
# Enhanced evaluation with better analysis
node scripts/evaluate-labeller-advanced.js <owner> <repo> --count 100

# With custom token
GITHUB_TOKEN=your_token node scripts/evaluate-labeller-advanced.js microsoft vscode --count 50
```

### Testing

```bash
# Run tests with mock data
npm test

# Or run directly
node scripts/test-evaluator.js
```

## Arguments and Options

### Required Arguments
- `owner`: Repository owner (username or organization)
- `repo`: Repository name

### Optional Arguments
- `--token <token>`: GitHub personal access token (or use `GITHUB_TOKEN` env var)
- `--count <number>`: Number of issues to evaluate (default: 100)
- `--help, -h`: Show help message

## Output Metrics

The evaluation scripts provide comprehensive metrics:

### Core Metrics
- **Precision**: Percentage of predicted labels that were correct
- **Recall**: Percentage of actual labels that were predicted
- **F1-Score**: Harmonic mean of precision and recall
- **Exact Match Rate**: Percentage of issues where predicted labels exactly match actual labels

### Advanced Metrics (Advanced Script Only)
- **Jaccard Index**: Intersection over union of label sets
- **Label-specific Accuracy**: Per-label performance analysis
- **Miss/Extra Analysis**: Detailed breakdown of prediction errors

## Example Output

```
🚀 Starting advanced evaluation for microsoft/vscode
📋 Found GenAI labeller script, attempting to use actual AI logic...
⚠️  Using keyword-based simulation (AI integration pending)
📊 Found 98 issues and 45 labels
📝 Available labels: bug, enhancement, documentation, question, ...

📈 Evaluation Results
==================================================
Repository: microsoft/vscode
Total issues evaluated: 85
Issues without labels (skipped): 13
Average Precision: 72.35%
Average Recall: 68.42%
Average F1-Score: 70.33%
Average Jaccard Index: 54.12%
Exact Match Rate: 31.76%

🏷️  Label-specific Performance:
--------------------------------------------------
  bug: 85.7% (24/28)
  enhancement: 72.2% (13/18)
  documentation: 90.0% (9/10)
  question: 66.7% (4/6)
  ...

💾 Detailed results saved to: evaluation-results-2025-01-15T10-30-45-123Z.json
```

## Requirements

- Node.js (built-in modules only, no external dependencies)
- GitHub personal access token with repository read access
- Repository with existing labeled issues for evaluation

## Limitations and Future Enhancements

### Current Limitations

**Important**: The current implementation uses keyword-based heuristics for label prediction. This is a simplified approach for demonstration purposes.

### For Real AI Evaluation

To use the actual GenAI labeller instead of simulation:

1. Ensure all dependencies are installed (`npm install`)
2. Set up GenAI environment and credentials
3. The advanced script has hooks for AI integration (see `initializeLabeller()` method)
4. Replace `generateLabelSuggestion()` with actual AI model calls

### Planned Enhancements

- [ ] Integration with actual GenAI script for real AI-based evaluation
- [ ] Support for different AI models and prompt variations
- [ ] Cross-validation and statistical significance testing
- [ ] Batch processing with intelligent rate limiting
- [ ] Label distribution and bias analysis
- [ ] Performance benchmarking and optimization
- [ ] Export results to CSV/Excel formats
- [ ] Visualization of results and trends

## File Structure

```
scripts/
├── README.md                      # This file
├── evaluate-labeller.js           # Basic evaluation script
├── evaluate-labeller-advanced.js  # Enhanced evaluation script
└── test-evaluator.js             # Test script with mock data
```

## API Rate Limiting

The scripts include protection against GitHub API rate limiting:
- Automatic delays between requests
- Rate limit detection and backoff
- Efficient pagination to minimize API calls

For large-scale evaluations, consider:
- Using a GitHub App token (higher rate limits)
- Running evaluation in smaller batches
- Implementing exponential backoff for rate limit recovery