# GitHub Action that assigns Labels to Issue

Uses an LLM to assign labels to a issue.

> [!NOTE]
> This action uses [GitHub Models](https://docs.github.com/en/github-models) for LLM inference.

## Algorithm Overview

This action analyzes a GitHub issue and tags it with relevant labels using a large language model (LLM) from GitHub Models. The algorithm works as follows:

1. **Fetch Issue and Labels**: Retrieves the issue content and the list of available labels from the repository.
2. **Prepare Prompt**: Constructs a system prompt for the LLM, including:
   - The issue title and body
   - The list of available labels with descriptions
   - Any existing labels on the issue
   - Optional additional instructions
   - A required output format (INI-style: `<label> = <reasoning>`, ranked by relevance)
3. **Run LLM Inference**: Sends the prompt to the LLM to generate label suggestions and reasoning.
4. **Parse and Filter**: Parses the LLM output, filters for valid and relevant labels, and limits the number of labels based on configuration.
5. **Update Issue**: Updates the GitHub issue with the new set of labels, combining existing and newly suggested ones.

## Inputs

- `github_token`: **required** GitHub token with `models: read` permission at least. (required)
- `github_issue`: **required** GitHub issue number to use when generating comments.
- `instructions`: Additional instructions to the LLM on how to label the issue.
- `max_labels`: Maximum number of labels to assign to the issue.
- `debug`: Enable debug logging.

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
          github_issue: ${{ github.event.issue.number }}
```

## Example

This workflow will label issues using GitHub Models.

```yaml
name: genai issue labeller
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
          github_issue: ${{ github.event.issue.number }}
```

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to contribute to this action.
