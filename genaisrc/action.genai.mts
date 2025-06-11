const { dbg } = env;
const issue = await github.getIssue();
if (!issue)
  throw new Error("Issue not configure, did you set the 'github_issue' input?");
const labels = await github.listIssueLabels();

const { fences, text } = await runPrompt(
  (ctx) => {
    ctx.$`You are a GitHub issue triage bot. Your task is to analyze the issue and suggest labels based on its content.

Respond with a list of "<label name> = <reasoning>" pairs, one per line in INI format.
If you think the issue does not fit any of the provided labels, respond with "no label".

\`\`\`\ini
label1 = reasoning1
label2 = reasoning2
\`\`\`
...

`.role("system");
    ctx.def(
      "LABELS",
      labels
        .map(({ name, description }) => `${name}: ${description}`)
        .join("\n"),
    );
    ctx.def("ISSUE", `${issue.title}\n${issue.body}`);
  },
  {
    choices: labels.map((label) => label.name),
  },
);

const entries = parsers.INI(
  fences.find((f) => f.language === "ini")?.content || text,
  { defaultValue: {} },
) as Record<string, string>;
dbg(`entries: %O`, entries);
const matchedLabels = Object.entries(entries)
  .map(([label]) => label.trim())
  .filter((label) => labels.some((l) => l.name === label));
dbg(`matched: %O`, matchedLabels);
if (matchedLabels.length === 0) {
  console.log("No labels matched, skipping.");
} else {
  console.log("Matched labels:", matchedLabels);
  await github.updateIssue(issue.number, { labels: matchedLabels });
  console.log("Labels updated successfully.");
}
