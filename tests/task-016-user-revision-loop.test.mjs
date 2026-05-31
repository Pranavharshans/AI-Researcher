import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const shell = readFileSync("src/components/project-shell.tsx", "utf8");
const preview = readFileSync("src/components/workspace/preview-pane.tsx", "utf8");
const projectTypes = readFileSync("src/types/project.ts", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

assert.match(projectTypes, /revisionHistory: string\[\]/, "Preview approval state must retain revision feedback history");
assert.match(preview, /What should change\?/, "Request Changes must ask for concrete feedback");
assert.match(preview, /revisionFeedbackMaxLength = 1200/, "Revision feedback must have a bounded length");
assert.match(preview, /Describe what should change before revising the diagram/, "Empty revision feedback must be rejected");
assert.match(preview, /onSubmitRevision\(trimmedFeedback\)/, "Revision form must submit normalized feedback");
assert.match(preview, /Revise Diagram/, "Revision form must expose an explicit revise action");
assert.match(preview, /aria-invalid=\{Boolean\(revisionError\)\}/, "Revision errors must be announced accessibly");
assert.match(shell, /onSubmitRevision=\{submitDiagramRevision\}/, "Project shell must wire revision submission");
assert.match(shell, /setAgentStatus\("AI status: revising existing diagram source"\)/, "Revision must announce that existing source is being revised");
assert.match(shell, /revisePreviewFromFeedback\(preview, feedback\)/, "Revision must modify the existing preview source");
assert.match(shell, /Used the existing TikZ source as the starting point/, "Revision summary must prove existing source reuse");
assert.match(shell, /status: "ready"/, "Successful revision must return to preview-ready approval");
assert.match(shell, /replaceAll\("\\\\draw\[\S+\]"/, "Curved-arrow feedback must target existing draw commands");
assert.match(shell, /revisionHistory: \[\.\.\.preview\.revisionHistory, feedback\]/, "Revision feedback must be appended to history");
assert.match(css, /\.diagram-revision-form/, "Revision form must have dedicated styling");
assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.diagram-revision-actions/, "Revision form must adapt on mobile");
assert.match(packageJson.scripts.test, /task-016-user-revision-loop/, "TASK-016 checks must run in npm test");

console.log("TASK-016 user revision loop checks passed");
