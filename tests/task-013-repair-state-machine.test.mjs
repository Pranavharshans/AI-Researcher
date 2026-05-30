import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const testRequire = createRequire(import.meta.url);
const stateMachineSource = readFileSync("src/server/agent/repair-state-machine.ts", "utf8");
const agentIndex = readFileSync("src/server/agent/index.ts", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

const loadStateMachine = () => {
  const transpiled = ts.transpileModule(stateMachineSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const repairModule = { exports: {} };
  vm.runInNewContext(transpiled, { module: repairModule, exports: repairModule.exports, require: testRequire });
  return repairModule.exports;
};

const {
  acceptDiagram,
  createDiagramRepairState,
  observeCompileResult,
  openDiagramPrompt,
  recordDiagnosis,
  recordPatchApplied,
  recordPatchPlan,
  requestUserRevision,
  setGeneratedSource,
  startRevisionFromFeedback,
  startSourceGeneration
} = loadStateMachine();

const error = {
  engine: "pdflatex",
  file: "diagram.tex",
  line: 5,
  severity: "error",
  rawMessage: "! Package pgf Error: No shape named `encoder' is known.",
  normalizedType: "unknown_tikz_node",
  sourceContext: {
    before: ["\\node[block] (enc) {Encoder};"],
    line: "\\draw[->] (encoder.east) -- (decoder.west);",
    after: []
  },
  hints: ["Possible node-name mismatch: enc vs encoder."]
};

const baseObservation = {
  tex: "\\node[block] (enc) {Encoder};",
  compileLog: "! Package pgf Error: No shape named `encoder' is known.",
  parsedErrors: [error],
  artifacts: [],
  succeeded: false
};

let state = createDiagramRepairState({
  originalPrompt: "Create an encoder diagram",
  safetyBudget: { maxCompileAttempts: 5, maxRepeatedErrorCount: 2 }
});

state = openDiagramPrompt(state);
state = startSourceGeneration(state);
state = setGeneratedSource(state, "\\node[block] (enc) {Encoder};");
assert.equal(state.phase, "COMPILING_STANDALONE");

state = observeCompileResult(state, baseObservation);
assert.equal(state.phase, "DIAGNOSING_FAILURE", "Failed compile should move to diagnosis, not blind retry");
assert.equal(state.attempts.length, 1);
assert.equal(state.attempts[0].parsedErrors[0].normalizedType, "unknown_tikz_node");

state = recordDiagnosis(state, {
  rootCause: "Draw command references encoder while source defines enc.",
  confidence: 0.92,
  evidence: ["No shape named `encoder' is known.", "Defined node: enc"],
  normalizedType: "unknown_tikz_node",
  nextAction: "Patch encoder reference to enc."
});
assert.equal(state.phase, "PLANNING_PATCH");

state = recordPatchPlan(state, {
  rootCause: "Node name mismatch.",
  confidence: 0.92,
  repairType: "minimal_source_patch",
  edits: [
    {
      file: "diagram.tex",
      operation: "replace",
      find: "(encoder.east)",
      replace: "(enc.east)"
    }
  ],
  expectedOutcome: "Unknown node error should disappear."
});
assert.equal(state.phase, "APPLYING_PATCH");

state = recordPatchApplied(state, "\\draw[->] (enc.east) -- (decoder.west);");
assert.equal(state.phase, "RECOMPILING");
assert.match(state.attempts[0].texAfter, /enc\.east/);

state = observeCompileResult(state, {
  tex: "\\draw[->] (enc.east) -- (decoder.west);",
  compileLog: "",
  parsedErrors: [],
  artifacts: [{ name: "diagram.pdf", path: "/tmp/diagram.pdf", kind: "pdf", sizeBytes: 128 }],
  succeeded: true
});
assert.equal(state.phase, "PREVIEW_READY");

state = acceptDiagram(state);
assert.equal(state.phase, "ACCEPTED");

let repeatedState = createDiagramRepairState({
  originalPrompt: "Create an encoder diagram",
  initialTex: "\\node[block] (enc) {Encoder};",
  safetyBudget: { maxCompileAttempts: 5, maxRepeatedErrorCount: 2 }
});
repeatedState = setGeneratedSource(repeatedState, repeatedState.currentTex);
repeatedState = observeCompileResult(repeatedState, baseObservation);
repeatedState = recordDiagnosis(repeatedState, {
  rootCause: "Node mismatch",
  confidence: 0.9,
  evidence: ["encoder missing"],
  normalizedType: "unknown_tikz_node",
  nextAction: "Patch"
});
repeatedState = recordPatchPlan(repeatedState, {
  rootCause: "Node mismatch",
  confidence: 0.9,
  repairType: "minimal_source_patch",
  edits: [],
  expectedOutcome: "Try patch"
});
repeatedState = recordPatchApplied(repeatedState, repeatedState.currentTex);
repeatedState = observeCompileResult(repeatedState, baseObservation);
repeatedState = recordDiagnosis(repeatedState, {
  rootCause: "Node mismatch persists",
  confidence: 0.8,
  evidence: ["same error"],
  normalizedType: "unknown_tikz_node",
  nextAction: "Escalate if repeated"
});
repeatedState = recordPatchPlan(repeatedState, {
  rootCause: "Node mismatch persists",
  confidence: 0.8,
  repairType: "alternate_patch",
  edits: [],
  expectedOutcome: "Try alternate patch"
});
repeatedState = recordPatchApplied(repeatedState, repeatedState.currentTex);
repeatedState = observeCompileResult(repeatedState, baseObservation);
assert.equal(repeatedState.phase, "NEEDS_ESCALATION", "Same repeated error should trigger escalation");

let revisionState = requestUserRevision(state, "Make arrows curved.");
revisionState = startRevisionFromFeedback(revisionState);
assert.equal(revisionState.phase, "REVISING_EXISTING_DIAGRAM");
assert.equal(revisionState.userFeedback, "Make arrows curved.");

assert.match(stateMachineSource, /observeCompileResult/, "State machine must observe compile results");
assert.match(stateMachineSource, /DIAGNOSING_FAILURE/, "State machine must diagnose failures");
assert.match(stateMachineSource, /PLANNING_PATCH/, "State machine must plan patches");
assert.match(stateMachineSource, /APPLYING_PATCH/, "State machine must apply patch plans");
assert.match(stateMachineSource, /RECOMPILING/, "State machine must verify by recompiling");
assert.match(stateMachineSource, /NEEDS_ESCALATION/, "State machine must support escalation");
assert.match(agentIndex, /createDiagramRepairState/, "Agent index must export the repair state machine");
assert.match(packageJson.scripts.test, /task-013-repair-state-machine/, "TASK-013 checks must run in npm test");

console.log("TASK-013 repair state machine checks passed");
