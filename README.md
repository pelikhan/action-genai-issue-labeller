# GitHub Action that assigns Labels to Issue

Uses an LLM to assign labels to a issue.

> [!NOTE]
> This action uses [GitHub Models](https://docs.github.com/en/github-models) for LLM inference.

## Algorithm Overview

This action analyzes a GitHub issue and tags it with relevant labels using a large language model (LLM) from GitHub Models. The algorithm works as follows:

1. **Fetch Issue and Labels**: Retrieves the issue content and the list of available labels from the repository.
2. **Prepare Prompt**: Constructs a prompt for the LLM, including:
   - The issue title and body
   - The list of available labels with descriptions
   - Any existing labels on the issue
   - Optional additional instructions
   - A required output format (INI-style: `<label> = <reasoning>`, ranked by relevance)
3. **Run LLM Inference**: Sends the prompt to the LLM to generate label suggestions and reasoning.
4. **Parse and Filter**: Parses the LLM output, filters for valid and relevant labels, and limits the number of labels based on configuration.
5. **Update Issue**: Updates the GitHub issue with the new set of labels, combining existing and newly suggested ones.

> [!TIP]
> Improve the description of your labels to increase the accuracy of the LLM's suggestions.

## Inputs

- `github_token`: **required** GitHub token with `models: read` permission at least. (required)
- `github_issue`: GitHub issue number to use when generating comments. This value is typically inferred from the event context.
- `instructions`: Additional instructions to the LLM on how to label the issue.
- `labels`: Comma-separated list of labels to use.
- `max_labels`: Maximum number of labels to assign to the issue.
- `debug`: Enable debug logging.

Note that `duplicate` and `wontfix` labels are always excluded from the suggestions, as they are not useful for categorization.

## Usage

Add the following to your step in your workflow file:

```yaml
on:
  issues:
      types: [opened, reopened, edited]
...
permissions:
  contents: read
  issues: write
  models: read
...
jobs:
  issue-labeller:
    ...
    steps:
      - uses: pelikhan/action-genai-issue-labeller@v0
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Example

This workflow will label issues using GitHub Models.
It also supports manual triggering with an input for the issue number.

```yaml
name: GenAI Issue Labeller
on:
  issues:
    types: [opened, reopened, edited]
permissions:
  contents: read
  issues: write
  models: read
concurrency:
  group: ${{ github.workflow }}-${{ github.event.issue.number }}
  cancel-in-progress: true
jobs:
  genai-issue-labeller:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pelikhan/action-genai-issue-labeller@v0
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to contribute to this action.

## Evaluation

To evaluate the accuracy of the labeller on existing issues, use the evaluation scripts:

```bash
# Basic evaluation
npm run evaluate <owner> <repo> -- --count 100

# Advanced evaluation (recommended - better analysis)
npm run evaluate:advanced <owner> <repo> -- --count 100

# Or run directly with Node.js
node scripts/evaluate-labeller.js <owner> <repo> --count 100 --token YOUR_GITHUB_TOKEN
node scripts/evaluate-labeller-advanced.js <owner> <repo> --count 100 --token YOUR_GITHUB_TOKEN

# Run tests with mock data
npm test
```

The evaluation scripts will:
- Fetch the last N issues from a repository
- Simulate the labelling process (using enhanced keyword-based heuristics)
- Compare predicted labels with existing labels
- Calculate comprehensive accuracy metrics (precision, recall, F1-score, etc.)
- Generate detailed reports with per-label analysis

**Note**: Current evaluation uses keyword-based simulation. Future versions will integrate with the actual AI model for real evaluation.

See [scripts/README.md](./scripts/README.md) for detailed documentation on evaluation functionality.
