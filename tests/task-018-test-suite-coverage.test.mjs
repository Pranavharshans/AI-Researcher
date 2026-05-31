import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const testScript = packageJson.scripts.test;

const sources = {
  addDialog: readFileSync("src/components/workspace/add-diagram-dialog.tsx", "utf8"),
  compilerSandbox: readFileSync("src/server/compiler/latex-sandbox.ts", "utf8"),
  contextMenu: readFileSync("src/components/workspace/editor-context-menu.tsx", "utf8"),
  css: readFileSync("src/app/globals.css", "utf8"),
  logParser: readFileSync("src/server/compiler/log-parser.ts", "utf8"),
  patchApplier: readFileSync("src/server/agent/patch-applier.ts", "utf8"),
  previewPane: readFileSync("src/components/workspace/preview-pane.tsx", "utf8"),
  processRunner: readFileSync("src/server/compiler/process-runner.ts", "utf8"),
  projectShell: readFileSync("src/components/project-shell.tsx", "utf8"),
  repairState: readFileSync("src/server/agent/repair-state-machine.ts", "utf8")
};

const tests = {
  task008: readFileSync("tests/task-008-context-menu.test.mjs", "utf8"),
  task009: readFileSync("tests/task-009-add-diagram-dialog.test.mjs", "utf8"),
  task010: readFileSync("tests/task-010-model-provider.test.mjs", "utf8"),
  task011: readFileSync("tests/task-011-compiler-sandbox.test.mjs", "utf8"),
  task012: readFileSync("tests/task-012-log-parser.test.mjs", "utf8"),
  task013: readFileSync("tests/task-013-repair-state-machine.test.mjs", "utf8"),
  task014: readFileSync("tests/task-014-patch-applier.test.mjs", "utf8"),
  task015: readFileSync("tests/task-015-preview-approval.test.mjs", "utf8"),
  task016: readFileSync("tests/task-016-user-revision-loop.test.mjs", "utf8"),
  task017: readFileSync("tests/task-017-document-insertion.test.mjs", "utf8")
};

[
  "task-007-shell",
  "task-008-context-menu",
  "task-009-add-diagram-dialog",
  "task-010-model-provider",
  "task-011-compiler-sandbox",
  "task-012-log-parser",
  "task-013-repair-state-machine",
  "task-014-patch-applier",
  "task-015-preview-approval",
  "task-016-user-revision-loop",
  "task-017-document-insertion",
  "task-018-test-suite-coverage"
].forEach((testName) => assert.match(testScript, new RegExp(testName), `${testName} must run in npm test`));

const requiredUnitCoverage = [
  [tests.task012, /Parser should return one basic LaTeX error/, "UT-001 basic LaTeX error parsing"],
  [tests.task012, /missing_tikz_library/, "UT-002 missing TikZ library detection"],
  [tests.task012, /unknown_tikz_node/, "UT-003 unknown node detection"],
  [tests.task012, /undefined_xcolor_color/, "UT-003b undefined xcolor color detection"],
  [tests.task014, /Patch applier should record applied edit/, "UT-004 structured patch validation"],
  [tests.task014, /path_outside_workspace/, "UT-005 path traversal rejection"],
  [tests.task013, /NEEDS_ESCALATION/, "UT-006 repeated error escalation"],
  [tests.task010, /OpenRouterProvider/, "provider request normalization"],
  [tests.task009, /promptMaxLength = 4000/, "prompt schema validation guard"]
];

const requiredIntegrationCoverage = [
  [sources.projectShell, /const preview = createPreviewFromRequest\([\s\S]*request,[\s\S]*generated,[\s\S]*setDiagramPreview\(preview\)/, "IT-001 simple diagram reaches preview"],
  [tests.task012, /usetikzlibrary.*positioning/, "IT-002 missing library repair evidence"],
  [tests.task014, /\(encoder\.east\)[\s\S]*\(enc\.east\)/, "IT-003 unknown node repair patch"],
  [sources.logParser, /return "latex_error"/, "malformed brace failures fall back to generic LaTeX error handling"],
  [tests.task014, /operation: "replace"/, "malformed source can be repaired by structured replace patch"],
  [tests.task016, /Used the existing TikZ source as the starting point/, "IT-004 user revision reuses current source"],
  [tests.task017, /inputPath/, "IT-005 accepted diagram inserts into main.tex"],
  [tests.task017, /repairGeneratedLatexColorAliases/, "IT-006 generated color aliases are auto-repaired after compile failure"]
];

const requiredE2ECoverage = [
  [tests.task008, /onContextMenuCapture/, "E2E-001 right-click editor entry"],
  [tests.task009, /Generate Diagram/, "E2E-001 prompt submission"],
  [sources.previewPane, /Does this match what you wanted\?/, "E2E-001 preview appears"],
  [tests.task013, /DIAGNOSING_FAILURE[\s\S]*PLANNING_PATCH[\s\S]*APPLYING_PATCH[\s\S]*RECOMPILING[\s\S]*PREVIEW_READY/, "E2E-002 repair flow"],
  [sources.previewPane, /What should change\?[\s\S]*Revise Diagram/, "E2E-003 request changes flow"],
  [sources.projectShell, /setCompileState\("running"\)[\s\S]*setCompileState\("success"\)/, "E2E-004 keep diagram triggers main compile"],
  [sources.contextMenu, /ArrowDown[\s\S]*Escape|Escape[\s\S]*ArrowDown/, "keyboard menu navigation and close"],
  [sources.addDialog, /event\.key === "Escape"/, "keyboard modal close"]
];

const requiredVisualCoverage = [
  [sources.css, /@media \(max-width: 760px\)/, "375px and mobile layout guard"],
  [sources.css, /@media \(max-width: 1120px\)/, "tablet and narrow desktop layout guard"],
  [sources.contextMenu, /clampPosition/, "context menu edge placement clamp"],
  [sources.contextMenu, /window\.innerWidth - menuWidth - viewportPadding/, "context menu right-edge guard"],
  [sources.contextMenu, /window\.innerHeight - menuHeight - viewportPadding/, "context menu bottom-edge guard"],
  [sources.css, /text-overflow: ellipsis/, "long labels truncate cleanly"],
  [sources.projectShell, /stageGeneratedDiagramSource\(preview\)/, "generated source is staged into a source file"],
  [tests.task015, /Responsive layout must keep approval visible/, "preview approval responsive guard"]
];

const requiredSecurityCoverage = [
  [sources.compilerSandbox, /"-no-shell-escape"/, "ST-001 shell escape disabled"],
  [sources.patchApplier, /path\.relative/, "ST-002 path traversal scope check"],
  [tests.task014, /absolute_path_rejected/, "ST-002 absolute path rejection"],
  [sources.processRunner, /SIGKILL/, "ST-003 compiler timeout kill"],
  [sources.compilerSandbox, /"--network",\s+"none"/, "ST-004 compile network disabled"],
  [sources.compilerSandbox, /\$\{options\.workspacePath\}:\/work:rw/, "compiler mounts only the job workspace"],
  [sources.patchApplier, /unsupported_operation/, "ST-005 model output operation allow-list"],
  [tests.task014, /Rejected patch must not modify allowed files/, "rejected model patch leaves files untouched"]
];

[
  ...requiredUnitCoverage,
  ...requiredIntegrationCoverage,
  ...requiredE2ECoverage,
  ...requiredVisualCoverage,
  ...requiredSecurityCoverage
].forEach(([source, pattern, description]) => assert.match(source, pattern, description));

console.log("TASK-018 test suite coverage checks passed");
