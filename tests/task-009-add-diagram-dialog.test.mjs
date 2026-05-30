import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dialog = readFileSync("src/components/workspace/add-diagram-dialog.tsx", "utf8");
const shell = readFileSync("src/components/project-shell.tsx", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

assert.match(dialog, /role="dialog"/, "Add Diagram must render as a dialog");
assert.match(dialog, /aria-modal="true"/, "Add Diagram dialog must be modal");
assert.match(dialog, /Diagram description/, "Dialog must include the required description field");
assert.match(dialog, /promptMaxLength = 4000/, "Prompt must have a 4,000 character limit");
assert.match(dialog, /Describe the diagram before generating it/, "Empty prompt validation must be user-readable");
assert.match(dialog, /Academic[\s\S]*Minimal[\s\S]*Detailed[\s\S]*Paper Figure/, "Dialog must expose style presets");
assert.match(dialog, /Inline at cursor[\s\S]*Create figure file[\s\S]*Replace placeholder/, "Dialog must expose output targets");
assert.match(dialog, /Generate Diagram/, "Dialog must include the primary generate action");
assert.match(dialog, /Cancel/, "Dialog must include a cancel action");
assert.match(dialog, /event\.key === "Escape"/, "Dialog must close on Escape");
assert.match(shell, /<AddDiagramDialog/, "Project shell must mount the Add Diagram dialog");
assert.match(shell, /setIsAddDiagramOpen\(true\)/, "Add diagram entry point must open the dialog");
assert.match(shell, /pending key/, "Submission must avoid OpenRouter calls while provider setup is pending");
assert.match(css, /z-index:\s*var\(--z-dialog\)/, "Dialog must use the fixed z-index scale");
assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.add-diagram-dialog/, "Dialog must have mobile responsive rules");
assert.match(packageJson.scripts.test, /task-009-add-diagram-dialog/, "TASK-009 checks must run in npm test");

console.log("TASK-009 Add Diagram dialog checks passed");
