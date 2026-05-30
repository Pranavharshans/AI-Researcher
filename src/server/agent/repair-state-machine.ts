import type { CompileArtifact, ParsedLatexError } from "@/server/compiler";

export type DiagramRepairPhase =
  | "IDLE"
  | "PROMPT_OPEN"
  | "GENERATING_SOURCE"
  | "COMPILING_STANDALONE"
  | "ANALYZING_COMPILE_RESULT"
  | "DIAGNOSING_FAILURE"
  | "PLANNING_PATCH"
  | "APPLYING_PATCH"
  | "RECOMPILING"
  | "PREVIEW_READY"
  | "AWAITING_USER_APPROVAL"
  | "ACCEPTED"
  | "INSERTING_IN_DOCUMENT"
  | "COMPILING_MAIN_DOCUMENT"
  | "DONE"
  | "NEEDS_ESCALATION"
  | "STRATEGY_SWITCH"
  | "FAILED_WITH_EXPLANATION"
  | "USER_REQUESTED_CHANGE"
  | "REVISING_EXISTING_DIAGRAM";

export type RepairPatchOperation = "replace" | "insert_before" | "insert_after" | "append";

export type RepairPatchEdit = {
  file: string;
  operation: RepairPatchOperation;
  find?: string;
  replace?: string;
};

export type RepairPatchPlan = {
  rootCause: string;
  confidence: number;
  repairType: string;
  edits: RepairPatchEdit[];
  expectedOutcome: string;
};

export type RepairDiagnosis = {
  rootCause: string;
  confidence: number;
  evidence: string[];
  normalizedType?: string;
  nextAction: string;
};

export type CompileObservation = {
  tex: string;
  compileLog: string;
  parsedErrors: ParsedLatexError[];
  artifacts: CompileArtifact[];
  succeeded: boolean;
};

export type RepairAttempt = {
  attemptNumber: number;
  phase: DiagramRepairPhase;
  texBefore: string;
  compileLog: string;
  parsedErrors: ParsedLatexError[];
  diagnosis?: RepairDiagnosis;
  patchPlan?: RepairPatchPlan;
  texAfter?: string;
  compileSucceeded: boolean;
  artifactPaths: string[];
  errorFingerprint?: string;
};

export type RepairTimelineEvent = {
  phase: DiagramRepairPhase;
  label: string;
  detail: string;
};

export type RepairSafetyBudget = {
  maxCompileAttempts: number;
  maxRepeatedErrorCount: number;
};

export type DiagramRepairState = {
  phase: DiagramRepairPhase;
  originalPrompt: string;
  currentTex: string;
  attempts: RepairAttempt[];
  timeline: RepairTimelineEvent[];
  safetyBudget: RepairSafetyBudget;
  currentDiagnosis?: RepairDiagnosis;
  currentPatchPlan?: RepairPatchPlan;
  failureExplanation?: string;
  userFeedback?: string;
};

export const defaultRepairSafetyBudget: RepairSafetyBudget = {
  maxCompileAttempts: 5,
  maxRepeatedErrorCount: 2
};

export const createDiagramRepairState = (input: {
  originalPrompt: string;
  initialTex?: string;
  safetyBudget?: Partial<RepairSafetyBudget>;
}): DiagramRepairState => ({
  phase: "IDLE",
  originalPrompt: input.originalPrompt,
  currentTex: input.initialTex ?? "",
  attempts: [],
  timeline: [
    {
      phase: "IDLE",
      label: "Idle",
      detail: "Waiting for a diagram request."
    }
  ],
  safetyBudget: {
    ...defaultRepairSafetyBudget,
    ...(input.safetyBudget ?? {})
  }
});

export const openDiagramPrompt = (state: DiagramRepairState): DiagramRepairState =>
  moveToPhase(state, "PROMPT_OPEN", "Prompt opened", "Collecting the diagram request.");

export const startSourceGeneration = (state: DiagramRepairState): DiagramRepairState =>
  moveToPhase(state, "GENERATING_SOURCE", "Generating TikZ", "Creating initial standalone diagram source.");

export const setGeneratedSource = (state: DiagramRepairState, tex: string): DiagramRepairState => ({
  ...moveToPhase(state, "COMPILING_STANDALONE", "Compiling standalone figure", "Checking generated TikZ before insertion."),
  currentTex: tex
});

export const observeCompileResult = (state: DiagramRepairState, observation: CompileObservation): DiagramRepairState => {
  const attempt = createAttempt(state, observation);
  const analyzedState: DiagramRepairState = {
    ...moveToPhase(state, "ANALYZING_COMPILE_RESULT", "Analyzing compile result", summarizeObservation(observation)),
    currentTex: observation.tex,
    attempts: [...state.attempts, attempt]
  };

  if (observation.succeeded && observation.artifacts.some((artifact) => artifact.kind === "pdf")) {
    return moveToPhase(analyzedState, "PREVIEW_READY", "Preview ready", "Standalone figure compiled and produced a PDF artifact.");
  }

  if (hasExceededAttemptBudget(analyzedState)) {
    return failWithExplanation(analyzedState, "Compile attempt budget exhausted before a valid preview was produced.");
  }

  if (hasRepeatedError(analyzedState)) {
    return moveToPhase(analyzedState, "NEEDS_ESCALATION", "Escalation needed", "The same compiler error repeated after repair.");
  }

  return moveToPhase(analyzedState, "DIAGNOSING_FAILURE", "Diagnosing compiler log", "Using parsed compiler evidence to identify the root cause.");
};

export const recordDiagnosis = (state: DiagramRepairState, diagnosis: RepairDiagnosis): DiagramRepairState => {
  const updatedAttempts = updateLatestAttempt(state.attempts, { diagnosis });

  return {
    ...moveToPhase(
      { ...state, attempts: updatedAttempts, currentDiagnosis: diagnosis },
      "PLANNING_PATCH",
      "Planning repair",
      diagnosis.rootCause
    )
  };
};

export const recordPatchPlan = (state: DiagramRepairState, patchPlan: RepairPatchPlan): DiagramRepairState => {
  const updatedAttempts = updateLatestAttempt(state.attempts, { patchPlan });

  return {
    ...moveToPhase(
      { ...state, attempts: updatedAttempts, currentPatchPlan: patchPlan },
      "APPLYING_PATCH",
      "Applying planned patch",
      patchPlan.expectedOutcome
    )
  };
};

export const recordPatchApplied = (state: DiagramRepairState, texAfter: string): DiagramRepairState => {
  const updatedAttempts = updateLatestAttempt(state.attempts, { texAfter });

  return {
    ...moveToPhase(
      { ...state, attempts: updatedAttempts, currentTex: texAfter },
      "RECOMPILING",
      "Recompiling",
      "Verifying the patched diagram source."
    )
  };
};

export const switchRepairStrategy = (state: DiagramRepairState, detail: string): DiagramRepairState =>
  moveToPhase(state, "STRATEGY_SWITCH", "Switching repair strategy", detail);

export const failWithExplanation = (state: DiagramRepairState, explanation: string): DiagramRepairState => ({
  ...moveToPhase(state, "FAILED_WITH_EXPLANATION", "Repair failed", explanation),
  failureExplanation: explanation
});

export const requestUserRevision = (state: DiagramRepairState, feedback: string): DiagramRepairState => ({
  ...moveToPhase(state, "USER_REQUESTED_CHANGE", "User requested changes", feedback),
  userFeedback: feedback
});

export const startRevisionFromFeedback = (state: DiagramRepairState): DiagramRepairState =>
  moveToPhase(state, "REVISING_EXISTING_DIAGRAM", "Revising existing diagram", "Using the current diagram source as the revision starting point.");

export const acceptDiagram = (state: DiagramRepairState): DiagramRepairState =>
  moveToPhase(state, "ACCEPTED", "Diagram accepted", "User approved the compiled diagram.");

export const startDocumentInsertion = (state: DiagramRepairState): DiagramRepairState =>
  moveToPhase(state, "INSERTING_IN_DOCUMENT", "Inserting diagram", "Applying the approved diagram to the LaTeX project.");

export const startMainDocumentCompile = (state: DiagramRepairState): DiagramRepairState =>
  moveToPhase(state, "COMPILING_MAIN_DOCUMENT", "Compiling main document", "Verifying the document after insertion.");

export const finishRepairWorkflow = (state: DiagramRepairState): DiagramRepairState =>
  moveToPhase(state, "DONE", "Done", "Diagram workflow completed.");

const moveToPhase = (state: DiagramRepairState, phase: DiagramRepairPhase, label: string, detail: string): DiagramRepairState => ({
  ...state,
  phase,
  timeline: [
    ...state.timeline,
    {
      phase,
      label,
      detail
    }
  ]
});

const createAttempt = (state: DiagramRepairState, observation: CompileObservation): RepairAttempt => ({
  attemptNumber: state.attempts.length + 1,
  phase: state.phase,
  texBefore: observation.tex,
  compileLog: observation.compileLog,
  parsedErrors: observation.parsedErrors,
  compileSucceeded: observation.succeeded,
  artifactPaths: observation.artifacts.map((artifact) => artifact.path),
  errorFingerprint: createErrorFingerprint(observation.parsedErrors[0])
});

const summarizeObservation = (observation: CompileObservation) => {
  if (observation.succeeded) {
    return "Compile succeeded; checking output artifacts.";
  }

  const firstError = observation.parsedErrors[0];

  if (!firstError) {
    return "Compile failed without a parsed error; escalation may be required.";
  }

  return `Compile failed: ${firstError.normalizedType}.`;
};

const hasExceededAttemptBudget = (state: DiagramRepairState) => state.attempts.length >= state.safetyBudget.maxCompileAttempts;

const hasRepeatedError = (state: DiagramRepairState) => {
  const latestFingerprint = state.attempts.at(-1)?.errorFingerprint;

  if (!latestFingerprint) {
    return false;
  }

  let repeatedCount = 0;

  for (let index = state.attempts.length - 1; index >= 0; index -= 1) {
    if (state.attempts[index]?.errorFingerprint !== latestFingerprint) {
      break;
    }

    repeatedCount += 1;
  }

  return repeatedCount > state.safetyBudget.maxRepeatedErrorCount;
};

const createErrorFingerprint = (error: ParsedLatexError | undefined) => {
  if (!error) {
    return undefined;
  }

  return [error.normalizedType, error.file ?? "unknown-file", error.line ?? "unknown-line", error.rawMessage.split("\n")[0]].join(":");
};

const updateLatestAttempt = (attempts: RepairAttempt[], patch: Partial<RepairAttempt>) =>
  attempts.map((attempt, index) => (index === attempts.length - 1 ? { ...attempt, ...patch } : attempt));
