export {
  PatchValidationError,
  applyStructuredPatchPlan,
  rollbackAppliedPatches,
  validatePatchPlan
} from "@/server/agent/patch-applier";
export {
  acceptDiagram,
  createDiagramRepairState,
  defaultRepairSafetyBudget,
  failWithExplanation,
  finishRepairWorkflow,
  observeCompileResult,
  openDiagramPrompt,
  recordDiagnosis,
  recordPatchApplied,
  recordPatchPlan,
  requestUserRevision,
  setGeneratedSource,
  startDocumentInsertion,
  startMainDocumentCompile,
  startRevisionFromFeedback,
  startSourceGeneration,
  switchRepairStrategy
} from "@/server/agent/repair-state-machine";
export type { AppliedPatchRecord, PatchApplyResult, PatchApplyStatus, PatchSecurityEvent } from "@/server/agent/patch-applier";
export type {
  CompileObservation,
  DiagramRepairPhase,
  DiagramRepairState,
  RepairAttempt,
  RepairDiagnosis,
  RepairPatchEdit,
  RepairPatchOperation,
  RepairPatchPlan,
  RepairSafetyBudget,
  RepairTimelineEvent
} from "@/server/agent/repair-state-machine";
