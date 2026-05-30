import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const testRequire = createRequire(import.meta.url);
const applierSource = readFileSync("src/server/agent/patch-applier.ts", "utf8");
const agentIndex = readFileSync("src/server/agent/index.ts", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

const loadPatchApplier = () => {
  const transpiled = ts.transpileModule(applierSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const applierModule = { exports: {} };
  vm.runInNewContext(transpiled, {
    module: applierModule,
    exports: applierModule.exports,
    require: testRequire
  });
  return applierModule.exports;
};

const {
  PatchValidationError,
  applyStructuredPatchPlan,
  rollbackAppliedPatches,
  validatePatchPlan
} = loadPatchApplier();

const workspace = await mkdtemp(path.join(tmpdir(), "lit-patch-"));
const diagramPath = path.join(workspace, "figures/generated/diagram_001.tex");
await mkdir(path.dirname(diagramPath), { recursive: true });
await writeFile(diagramPath, "\\draw[->] (encoder.east) -- (decoder.west);\n", "utf8");

const patchPlan = {
  rootCause: "The source references encoder but defines enc.",
  confidence: 0.93,
  repairType: "minimal_source_patch",
  edits: [
    {
      file: "figures/generated/diagram_001.tex",
      operation: "replace",
      find: "(encoder.east)",
      replace: "(enc.east)"
    }
  ],
  expectedOutcome: "Unknown node error should disappear."
};

const result = await applyStructuredPatchPlan(workspace, patchPlan);
assert.equal(result.applied.length, 1, "Patch applier should record applied edit");
assert.equal(result.securityEvents.length, 0, "Valid patch should not emit security events");
assert.match(await readFile(diagramPath, "utf8"), /\(enc\.east\)/, "Patch should update file content");
assert.match(result.applied[0].beforeContent, /encoder\.east/, "Patch record must include original content");
assert.match(result.applied[0].afterContent, /enc\.east/, "Patch record must include updated content");

await rollbackAppliedPatches(result.applied);
assert.match(await readFile(diagramPath, "utf8"), /\(encoder\.east\)/, "Rollback must restore original content");

const rejectedTraversal = {
  ...patchPlan,
  edits: [
    {
      file: "../outside.tex",
      operation: "replace",
      find: "x",
      replace: "y"
    }
  ]
};
const traversalEvents = validatePatchPlan(workspace, rejectedTraversal);
assert.equal(traversalEvents[0].code, "path_outside_workspace", "Traversal path must be rejected");

const absolutePathPlan = {
  ...patchPlan,
  edits: [
    {
      file: "/tmp/outside.tex",
      operation: "replace",
      find: "x",
      replace: "y"
    }
  ]
};
await assert.rejects(
  () => applyStructuredPatchPlan(workspace, absolutePathPlan),
  (error) => error instanceof PatchValidationError && error.securityEvents[0].code === "absolute_path_rejected"
);
assert.match(await readFile(diagramPath, "utf8"), /\(encoder\.east\)/, "Rejected patch must not modify allowed files");

const appendPlan = {
  ...patchPlan,
  edits: [
    {
      file: "figures/generated/diagram_001.tex",
      operation: "append",
      replace: "% repaired\n"
    }
  ]
};
await applyStructuredPatchPlan(workspace, appendPlan);
assert.match(await readFile(diagramPath, "utf8"), /% repaired/, "Append operation should be supported");

assert.match(applierSource, /validatePatchPlan/, "Patch applier must expose validation");
assert.match(applierSource, /path\.relative/, "Patch applier must enforce workspace-relative paths");
assert.match(applierSource, /rollbackAppliedPatches/, "Patch applier must support rollback");
assert.match(agentIndex, /applyStructuredPatchPlan/, "Agent index must export patch applier");
assert.match(packageJson.scripts.test, /task-014-patch-applier/, "TASK-014 checks must run in npm test");

console.log("TASK-014 structured patch applier checks passed");
