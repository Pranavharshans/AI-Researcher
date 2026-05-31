import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const shell = readFileSync("src/components/project-shell.tsx", "utf8");
const editor = readFileSync("src/components/workspace/editor-pane.tsx", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

assert.match(shell, /useState<ProjectFile\[\]>\(sampleFiles\)/, "Project files must become stateful for insertion");
assert.match(shell, /const generatedFigurePath = "figures\/generated\/diagram_001\.tex"/, "Approved diagram source must target figures/generated");
assert.match(shell, /sourcePath: generatedFigurePath/, "Preview source path must point to the generated figure file");
assert.match(shell, /onKeepDiagram=\{keepDiagram\}/, "Keep Diagram must run the insertion workflow");
assert.match(shell, /insertApprovedDiagram\(projectFiles, diagramPreview\)/, "Insertion must use current project files and approved preview");
assert.match(shell, /saveGeneratedFigureSource\(files, preview\.sourcePath, preview\.source\)/, "Insertion must save approved TikZ source");
assert.match(shell, /insertDiagramInputIntoMain\(file\.content, preview\)/, "Insertion must patch main.tex");
assert.match(shell, /\\input\{\$\{inputPath\}\}/, "Inserted figure block must input the generated source");
assert.match(shell, /\\label\{fig:generated-diagram-001\}/, "Inserted figure block must include a stable label");
assert.match(shell, /diagramInsertionMarker/, "Insertion must target the existing editor placeholder");
assert.match(shell, /setActiveFileId\("main"\)/, "After insertion the main document should become active");
assert.match(shell, /setCompileState\("running"\)[\s\S]*setCompileState\("success"\)/, "Insertion must trigger main document compile status");
assert.match(shell, /diagram saved to \$\{diagramPreview\.sourcePath\} and inserted into/, "Status must confirm saved source and insertion");
assert.match(editor, /key=\{`\$\{file\.id\}:\$\{file\.content\.length\}`\}/, "Editor must remount when inserted source changes active content");
assert.match(packageJson.scripts.test, /task-017-document-insertion/, "TASK-017 checks must run in npm test");

console.log("TASK-017 document insertion checks passed");
