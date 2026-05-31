import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const testRequire = createRequire(import.meta.url);
const parserSource = readFileSync("src/server/compiler/log-parser.ts", "utf8");
const compilerTypes = readFileSync("src/server/compiler/types.ts", "utf8");
const compilerIndex = readFileSync("src/server/compiler/index.ts", "utf8");
const sandbox = readFileSync("src/server/compiler/latex-sandbox.ts", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

const loadParser = () => {
  const transpiled = ts.transpileModule(parserSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const parserModule = { exports: {} };
  vm.runInNewContext(transpiled, { module: parserModule, exports: parserModule.exports, require: testRequire });
  return parserModule.exports;
};

const { parseLatexLog } = loadParser();

const source = [
  "\\documentclass[tikz,border=4pt]{standalone}",
  "\\usepackage{tikz}",
  "\\begin{document}",
  "\\node[draw] (enc) {Encoder};",
  "\\draw[->] (encoder.east) -- (decoder.west);",
  "\\end{document}"
].join("\n");

const basicErrors = parseLatexLog(
  [
    "(diagram.tex",
    "! Undefined control sequence.",
    "l.5 \\\\badcommand",
    ""
  ].join("\n"),
  { source, sourceFilePath: "diagram.tex" }
);

assert.equal(basicErrors.length, 1, "Parser should return one basic LaTeX error");
assert.equal(basicErrors[0].severity, "error");
assert.equal(basicErrors[0].file, "diagram.tex");
assert.equal(basicErrors[0].line, 5);
assert.equal(basicErrors[0].normalizedType, "undefined_control_sequence");
assert.match(basicErrors[0].rawMessage, /Undefined control sequence/);
assert.equal(basicErrors[0].sourceContext.line, "\\draw[->] (encoder.east) -- (decoder.west);");

const missingLibraryErrors = parseLatexLog(
  [
    "! Package pgfkeys Error: I do not know the key '/tikz/right', to which you passed 'of enc'.",
    "l.4 \\\\node[draw,right=of enc] (decoder) {Decoder};"
  ].join("\n"),
  { source, sourceFilePath: "figures/generated/diagram_001.tex" }
);

assert.equal(missingLibraryErrors[0].normalizedType, "missing_tikz_library");
assert.match(missingLibraryErrors[0].hints.join(" "), /\\usetikzlibrary\{positioning\}/);

const undefinedColorErrors = parseLatexLog(
  [
    "! Package xcolor Error: Undefined color `amber'.",
    "l.4 ... fill=amber!10] (mlp) {Feed-forward block};"
  ].join("\n"),
  { source, sourceFilePath: "figures/generated/diagram_001.tex" }
);

assert.equal(undefinedColorErrors[0].normalizedType, "undefined_xcolor_color");
assert.match(undefinedColorErrors[0].hints.join(" "), /standard LaTeX color/);

const unknownNodeErrors = parseLatexLog(
  [
    "! Package pgf Error: No shape named `encoder' is known.",
    "l.5 \\\\draw[->] (encoder.east) -- (decoder.west);"
  ].join("\n"),
  { source, sourceFilePath: "figures/generated/diagram_001.tex" }
);

assert.equal(unknownNodeErrors[0].normalizedType, "unknown_tikz_node");
assert.match(unknownNodeErrors[0].hints.join(" "), /enc vs encoder/);
assert.equal(
  JSON.stringify(unknownNodeErrors[0].sourceContext.before),
  JSON.stringify(["\\begin{document}", "\\node[draw] (enc) {Encoder};"])
);

assert.match(compilerTypes, /ParsedLatexError/, "Compiler types must export parsed error shape");
assert.match(compilerIndex, /parseLatexLog/, "Compiler index must export the log parser");
assert.match(sandbox, /parsedErrors: parseLatexLog/, "Compiler sandbox must attach parsed errors to compile results");
assert.match(packageJson.scripts.test, /task-012-log-parser/, "TASK-012 checks must run in npm test");

console.log("TASK-012 LaTeX log parser checks passed");
