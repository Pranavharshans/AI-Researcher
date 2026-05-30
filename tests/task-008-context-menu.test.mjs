import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const editor = readFileSync("src/components/workspace/editor-pane.tsx", "utf8");
const contextMenu = readFileSync("src/components/workspace/editor-context-menu.tsx", "utf8");
const statusBar = readFileSync("src/components/workspace/status-bar.tsx", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");

assert.match(editor, /onContextMenuCapture=\{openContextMenu\}/, "Editor must open a custom menu on right-click");
assert.match(editor, /contextmenu:\s*false/, "Native Monaco context menu must be disabled for the product flow");
assert.match(editor, /toolbar-command/, "Editor must expose a toolbar fallback for touch and keyboard users");
assert.match(contextMenu, /Add diagram/, "Context menu must include Add diagram");
assert.match(contextMenu, /role="menu"/, "Context menu must use menu semantics");
assert.match(contextMenu, /role="menuitem"/, "Context menu actions must use menuitem semantics");
assert.match(contextMenu, /event\.key === "Escape"/, "Context menu must close on Escape");
assert.match(contextMenu, /document\.addEventListener\("pointerdown"/, "Context menu must close on outside pointer interaction");
assert.match(contextMenu, /ArrowDown/, "Context menu must support keyboard navigation");
assert.match(contextMenu, /--z-context-menu|editor-context-menu/, "Context menu implementation must use bounded overlay styling");
assert.match(statusBar, /agentStatus/, "Add diagram selection must be visible through status feedback");
assert.match(css, /z-index:\s*var\(--z-context-menu\)/, "Context menu must use the fixed z-index scale");
assert.doesNotMatch(css, /z-index:\s*999/, "Context menu CSS must not use arbitrary large z-index values");

console.log("TASK-008 context menu checks passed");
