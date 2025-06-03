const issue = await github.getIssue()
const labels = await github.listIssueLabels()

const { text } = await runPrompt(ctx => {
    ctx.$`You are a GitHub issue triage bot. Your task is to analyze the issue and suggest labels based on its content.

Respond with a list of "<label name>: <reasoning>" pairs, one per line.
If you think the issue does not fit any of the provided labels, respond with "no label".

label1: reasoning1
label2: reasoning2
...

`.role("system")
    ctx.def("LABELS", labels.map(({ name, description }) => `${name}: ${description}`).join("\n"))
    ctx.def("ISSUE_TITLE", issue.title)
    ctx.def("ISSUE_BODY", issue.body)
}, {
    choices: labels.map(label => label.name)
})

const matchedLabels = text.split("\n").map(line => {
    const match = line.match(/^(.*?):\s*(.*)$/);
    if (match) {
        return match[1].trim();
    }
    return null;
}
).filter(label => label && labels.some(l => l.name === label));
if (matchedLabels.length === 0) {
    console.log("No labels matched, skipping.");
}
else {
    console.log("Matched labels:", matchedLabels);
    await github.updateIssue(issue.number, { labels: matchedLabels });
    console.log("Labels added successfully.");
}