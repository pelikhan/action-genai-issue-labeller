# GitHub Action that assigns Labels to Issue

Uses an LLM to assign labels to a issue.

> [!NOTE]
> This action uses GitHub Models for LLM inference.

## Inputs

- `github_token`: **required** GitHub token with `models: read` permission at least. (required)
- `github_issue`: **required** GitHub issue number to use when generating comments.
- `instructions`: Additional instructions to the LLM on how to label the issue.
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
