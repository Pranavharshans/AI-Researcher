import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const shell = readFileSync("src/components/project-shell.tsx", "utf8");
const preview = readFileSync("src/components/workspace/preview-pane.tsx", "utf8");
const projectTypes = readFileSync("src/types/project.ts", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

assert.match(projectTypes, /DiagramPreviewApproval/, "Project types must define a diagram preview approval model");
assert.match(projectTypes, /"ready" \| "kept" \| "changes-requested" \| "discarded"/, "Preview status must model all approval outcomes");
assert.match(shell, /setDiagramPreview\(createPreviewFromRequest\(request\)\)/, "Diagram submission must create a preview approval state");
assert.match(shell, /data-preview-open=\{Boolean\(diagramPreview\)\}/, "Workspace must expose active preview state for responsive layout");
assert.match(shell, /diagram compiled; waiting for approval/, "Submission must announce preview readiness");
assert.match(shell, /onKeepDiagram=\{keepDiagram\}/, "Shell must wire Keep Diagram");
assert.match(shell, /onRequestChanges=\{\(\) => updateDiagramApproval\("changes-requested"\)\}/, "Shell must wire Request Changes");
assert.match(shell, /onDiscardDiagram=\{\(\) => updateDiagramApproval\("discarded"\)\}/, "Shell must wire Discard");
assert.match(shell, /No OpenRouter call was made/, "Preview fixture must remain keyless and avoid provider calls");
assert.match(preview, /Does this match what you wanted\?/, "Preview ready state must ask the approval question");
assert.match(preview, /Keep Diagram/, "Approval actions must include Keep Diagram");
assert.match(preview, /Request Changes/, "Approval actions must include Request Changes");
assert.match(preview, /Discard/, "Approval actions must include Discard");
assert.match(preview, /aria-label="Diagram approval checkpoint"/, "Approval checkpoint must be labelled for assistive tech");
assert.match(preview, /aria-live="polite"/, "Approval state changes must be announced politely");
assert.match(preview, /Source preview/, "Approval view must expose a collapsible source preview");
assert.match(preview, /accessibleSummary/, "Rendered diagram preview must carry an accessible summary");
assert.match(preview, /disabled=\{diagramPreview\.status !== "ready"\}/, "Approval actions must lock after a decision");
assert.match(css, /\.compiled-diagram-preview/, "CSS must style the compiled diagram preview");
assert.match(css, /\.diagram-approval-actions/, "CSS must style approval actions");
assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.diagram-flow/, "Diagram preview must adapt for mobile");
assert.match(css, /\.workspace-grid\[data-preview-open="true"\][\s\S]*\.preview-pane/, "Responsive layout must keep approval visible");
assert.match(packageJson.scripts.test, /task-015-preview-approval/, "TASK-015 checks must run in npm test");

console.log("TASK-015 preview approval checks passed");
