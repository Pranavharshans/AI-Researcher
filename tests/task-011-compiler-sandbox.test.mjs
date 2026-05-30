import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sandbox = readFileSync("src/server/compiler/latex-sandbox.ts", "utf8");
const standalone = readFileSync("src/server/compiler/standalone.ts", "utf8");
const runner = readFileSync("src/server/compiler/process-runner.ts", "utf8");
const types = readFileSync("src/server/compiler/types.ts", "utf8");
const index = readFileSync("src/server/compiler/index.ts", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

assert.match(types, /LatexCompileRequest/, "Compiler request type must exist");
assert.match(types, /LatexCompileResult/, "Compiler result type must exist");
assert.match(types, /artifacts: CompileArtifact\[\]/, "Compiler result must expose captured artifacts");
assert.match(standalone, /\\\\documentclass\[tikz,border=\$\{border\}pt\]\{standalone\}/, "Standalone wrapper must use the standalone TikZ document class");
assert.match(standalone, /\\\\usepackage\{tikz\}/, "Standalone wrapper must load TikZ");
assert.match(sandbox, /mkdtemp/, "Compiler must create a per-job temporary workspace");
assert.match(sandbox, /"--network",\s+"none"/, "Docker sandbox must disable network access");
assert.match(sandbox, /"-no-shell-escape"/, "Compiler command must disable shell escape");
assert.match(sandbox, /"--cpus"/, "Docker sandbox must apply a CPU limit");
assert.match(sandbox, /"--memory"/, "Docker sandbox must apply a memory limit");
assert.match(sandbox, /timeoutMs/, "Compiler command must enforce a timeout");
assert.match(sandbox, /readCompileLog/, "Compiler must capture compile logs");
assert.match(sandbox, /collectArtifacts/, "Compiler must capture output artifacts");
assert.match(runner, /shell:\s*false/, "Process runner must not invoke a shell");
assert.match(runner, /SIGKILL/, "Process runner must terminate timed-out compiles");
assert.match(index, /createLatexCompilerSandbox/, "Compiler index must export the sandbox factory");
assert.match(packageJson.scripts.test, /task-011-compiler-sandbox/, "TASK-011 checks must run in npm test");

console.log("TASK-011 compiler sandbox checks passed");
