script({
  title: "Labels GitHub issues based on their content using GitHub Models",
  description:
    "A GitHub Action to label issues based on their content using AI.",
  accept: "none",
  branding: {
    icon: "map-pin",
    color: "yellow",
  },
  parameters: {
    labels: {
      type: "string",
      description: "List of labels to use for labeling issues.",
    },
    maxLabels: {
      type: "integer",
      description: "Maximum number of labels to suggest.",
      minimum: 1,
    },
    instructions: {
      type: "string",
      description:
        "Additional Instructions for the AI model to follow when labeling issues. These instructions will be inserted in the system prompt.",
    },
  },
});

const { dbg, vars, output } = env;
const issue = await github.getIssue();
if (!issue)
  throw new Error("Issue not configure, did you set the 'github_issue' input?");
const { instructions, maxLabels } = vars as {
  instructions: string;
  maxLabels: number;
};
const allowedLabels = vars.labels?.split(/,\s*/g)?.filter(Boolean);
dbg(`issue: %O`, issue);
dbg(`allowed labels: %O`, allowedLabels);
dbg(`maxLabels: %d`, maxLabels);
dbg(`instructions: %s`, instructions || "none");

const labels = (await github.listIssueLabels()).filter(
  (label) => !allowedLabels?.length || allowedLabels.includes(label.name)
);
if (!labels.length)
  throw new Error("No labels found or all labels are filtered out.");
const issueLabels =
  issue.labels?.map((l) => (typeof l === "string" ? l : l.name)) || [];

output.heading(3, "Issue Details");
output.itemLink(issue.html_url);
output.item("title");
output.fence(issue.title);
output.item("body");
output.fence(issue.body);
output.itemValue("labels", issueLabels.join(", "));
output.heading(3, `Available labels`);
for (const label of labels)
  output.itemValue(label.name, label.description || "");

const { fences, text, error } = await runPrompt(
  (ctx) => {
    ctx.$`You are a GitHub issue triage bot. Your task is to analyze the issue and suggest labels based on its content.`.role(
      "system"
    );
    if (instructions)
      ctx.$`## Additional Instructions
${instructions}`.role("system");
    if (issueLabels?.length)
      ctx.$`## Existing Labels
The issue already has these labels: ${issueLabels.join(", ")}`.role("system");
    ctx.$`## Output format

Respond with a list of "<label name> = <reasoning>" pairs, one per line in INI format.
If you think the issue does not fit any of the provided labels, respond with "no label".
Rank the labels by relevance, with the most relevant label first.

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
        .join("\n")
    );
    ctx.def("ISSUE", `${issue.title}\n${issue.body}`);
  },
  {
    responseType: "text",
    systemSafety: false,
    label: "Assigning labels to GitHub issue",
    model: "small",
  }
);
if (error) cancel(`error while running the prompt: ${error.message}`);

output.heading(3, "AI Response");
output.fence(text);
const entries = parsers.INI(
  fences.find((f) => f.language === "ini")?.content || text,
  { defaultValue: {} }
) as Record<string, string>;
dbg(`entries: %O`, entries);
const matchedLabels = Object.entries(entries)
  .map(([label]) => label.trim())
  .filter((label) => labels.some((l) => l.name === label));
dbg(`matched: %O`, matchedLabels);
if (matchedLabels.length === 0) {
  output.warn("No labels matched, skipping.");
} else {
  output.itemValue("matched labels", matchedLabels.join(", "));
  const filteredLabels =
    maxLabels > 0 ? matchedLabels.slice(0, maxLabels) : matchedLabels;
  dbg(`filtered labels: %O`, filteredLabels);
  dbg(`existing labels: %O`, issueLabels);
  const labels = Array.from(new Set([...issueLabels, ...filteredLabels]));
  output.itemValue("merged labels", labels.join(", "));
  dbg(`final labels: %O`, labels);
  await github.updateIssue(issue.number, {
    labels,
  });
  output.note("Labels updated successfully.");
}
