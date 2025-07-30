#!/usr/bin/env node

/**
 * Example usage of the labeller evaluation scripts
 * 
 * This demonstrates how to use the evaluation framework
 * and shows sample commands for common use cases.
 */

console.log(`
🎯 GenAI Issue Labeller Evaluation Framework
============================================

This framework helps evaluate the accuracy of the GenAI Issue Labeller
by testing it against existing labeled issues in GitHub repositories.

📋 Available Scripts:
--------------------

1. Basic Evaluation:
   npm run evaluate <owner> <repo> -- --count 100
   
2. Advanced Evaluation (Recommended):
   npm run evaluate:advanced <owner> <repo> -- --count 100
   
3. Test with Mock Data:
   npm test

📖 Example Commands:
-------------------

# Evaluate on popular repositories
npm run evaluate:advanced microsoft vscode -- --count 50
npm run evaluate:advanced facebook react -- --count 30
npm run evaluate:advanced nodejs node -- --count 75

# Evaluate with custom GitHub token
GITHUB_TOKEN=ghp_xxxx npm run evaluate:advanced owner repo -- --count 100

# Direct script usage
node scripts/evaluate-labeller-advanced.js microsoft typescript --count 25

📊 What You'll Get:
------------------

✓ Comprehensive accuracy metrics (Precision, Recall, F1-Score)
✓ Per-label performance analysis  
✓ Detailed error analysis (missed vs extra predictions)
✓ JSON report with all results
✓ Rate limiting protection for large evaluations

🔧 Requirements:
---------------

• Node.js (built-in modules only)
• GitHub personal access token
• Target repository with existing labeled issues

📚 Documentation:
----------------

For detailed information, see:
• scripts/README.md - Complete documentation
• README.md - Project overview and usage

🚀 Quick Start:
--------------

1. Set your GitHub token:
   export GITHUB_TOKEN=your_token_here

2. Run a test evaluation:
   npm test

3. Evaluate a real repository:
   npm run evaluate:advanced microsoft vscode -- --count 20

Happy evaluating! 🎉
`);

// Show help for the main evaluation script
console.log('\n📋 Advanced Evaluation Script Help:\n');
require('./evaluate-labeller-advanced.js');