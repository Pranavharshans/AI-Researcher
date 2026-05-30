import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  packageJson: readFileSync("package.json", "utf8"),
  shell: readFileSync("src/components/project-shell.tsx", "utf8"),
  editor: readFileSync("src/components/workspace/editor-pane.tsx", "utf8"),
  contextMenu: readFileSync("src/components/workspace/editor-context-menu.tsx", "utf8"),
  fileTree: readFileSync("src/components/workspace/file-tree.tsx", "utf8"),
  preview: readFileSync("src/components/workspace/preview-pane.tsx", "utf8"),
  status: readFileSync("src/components/workspace/status-bar.tsx", "utf8"),
  css: readFileSync("src/app/globals.css", "utf8")
};

const packageData = JSON.parse(files.packageJson);

assert.equal(packageData.dependencies.next, "latest", "Next.js must be present for the app shell");
assert.equal(packageData.dependencies["@monaco-editor/react"], "latest", "Monaco editor dependency must be present");
assert.match(files.shell, /<FileTree[\s\S]*<EditorPane[\s\S]*<PreviewPane/, "ProjectShell must include file tree, editor, and preview panes");
assert.match(files.editor, /@monaco-editor\/react/, "Editor pane must load Monaco");
assert.match(files.contextMenu, /role="menu"/, "Editor context menu must use menu semantics");
assert.match(files.preview, /aria-live="polite"/, "Preview status must be announced accessibly");
assert.match(files.status, /aria-label="Compile and editor status"/, "Status bar must expose an accessible label");
assert.match(files.css, /--z-context-menu:\s*30;/, "Shell must establish a bounded z-index scale");
assert.match(files.css, /@media \(max-width: 760px\)/, "Shell must include mobile responsive rules");
assert.doesNotMatch(files.css, /letter-spacing:\s*-\d/, "UI typography must not use negative letter spacing");

console.log("TASK-007 shell checks passed");
