import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepairPatchEdit, RepairPatchOperation, RepairPatchPlan } from "@/server/agent/repair-state-machine";

export type PatchApplyStatus = "applied" | "rejected";

export type PatchSecurityEvent = {
  code: "path_outside_workspace" | "absolute_path_rejected" | "missing_find_text" | "unsupported_operation";
  file: string;
  message: string;
};

export type AppliedPatchRecord = {
  file: string;
  absolutePath: string;
  operation: RepairPatchOperation;
  beforeContent: string;
  afterContent: string;
  status: PatchApplyStatus;
};

export type PatchApplyResult = {
  applied: AppliedPatchRecord[];
  securityEvents: PatchSecurityEvent[];
};

export class PatchValidationError extends Error {
  readonly securityEvents: PatchSecurityEvent[];

  constructor(message: string, securityEvents: PatchSecurityEvent[]) {
    super(message);
    this.name = "PatchValidationError";
    this.securityEvents = securityEvents;
  }
}

export const applyStructuredPatchPlan = async (workspaceRoot: string, patchPlan: RepairPatchPlan): Promise<PatchApplyResult> => {
  const root = path.resolve(workspaceRoot);
  const securityEvents = validatePatchPlan(root, patchPlan);

  if (securityEvents.length > 0) {
    throw new PatchValidationError("Patch plan failed validation.", securityEvents);
  }

  const applied: AppliedPatchRecord[] = [];

  try {
    for (const edit of patchPlan.edits) {
      const absolutePath = resolveWorkspacePath(root, edit.file);
      const beforeContent = await readFile(absolutePath, "utf8");
      const afterContent = applyEditToContent(beforeContent, edit);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, afterContent, "utf8");
      applied.push({
        file: edit.file,
        absolutePath,
        operation: edit.operation,
        beforeContent,
        afterContent,
        status: "applied"
      });
    }
  } catch (error) {
    await rollbackAppliedPatches(applied);
    throw error;
  }

  return {
    applied,
    securityEvents: []
  };
};

export const rollbackAppliedPatches = async (records: AppliedPatchRecord[]) => {
  for (const record of [...records].reverse()) {
    await writeFile(record.absolutePath, record.beforeContent, "utf8");
  }
};

export const validatePatchPlan = (workspaceRoot: string, patchPlan: RepairPatchPlan): PatchSecurityEvent[] => {
  const root = path.resolve(workspaceRoot);
  const events: PatchSecurityEvent[] = [];

  for (const edit of patchPlan.edits) {
    if (!isSupportedOperation(edit.operation)) {
      events.push({
        code: "unsupported_operation",
        file: edit.file,
        message: `Unsupported patch operation: ${edit.operation}.`
      });
      continue;
    }

    if (path.isAbsolute(edit.file)) {
      events.push({
        code: "absolute_path_rejected",
        file: edit.file,
        message: "Patch file paths must be relative to the job workspace."
      });
      continue;
    }

    const absolutePath = resolveWorkspacePath(root, edit.file);

    if (!isWithinWorkspace(root, absolutePath)) {
      events.push({
        code: "path_outside_workspace",
        file: edit.file,
        message: "Patch attempted to write outside the job workspace."
      });
      continue;
    }

    if (edit.operation !== "append" && !edit.find) {
      events.push({
        code: "missing_find_text",
        file: edit.file,
        message: `Patch operation ${edit.operation} requires a find value.`
      });
    }
  }

  return events;
};

const applyEditToContent = (content: string, edit: RepairPatchEdit) => {
  if (edit.operation === "append") {
    return `${content}${edit.replace ?? ""}`;
  }

  if (!edit.find) {
    throw new PatchValidationError("Patch edit is missing required find text.", [
      {
        code: "missing_find_text",
        file: edit.file,
        message: `Patch operation ${edit.operation} requires a find value.`
      }
    ]);
  }

  if (!content.includes(edit.find)) {
    throw new PatchValidationError("Patch find text was not found in target file.", [
      {
        code: "missing_find_text",
        file: edit.file,
        message: "Patch find text was not found in target file."
      }
    ]);
  }

  if (edit.operation === "replace") {
    return content.replace(edit.find, edit.replace ?? "");
  }

  if (edit.operation === "insert_before") {
    return content.replace(edit.find, `${edit.replace ?? ""}${edit.find}`);
  }

  if (edit.operation === "insert_after") {
    return content.replace(edit.find, `${edit.find}${edit.replace ?? ""}`);
  }

  throw new PatchValidationError("Unsupported patch operation.", [
    {
      code: "unsupported_operation",
      file: edit.file,
      message: `Unsupported patch operation: ${edit.operation}.`
    }
  ]);
};

const resolveWorkspacePath = (workspaceRoot: string, relativeFilePath: string) => path.resolve(workspaceRoot, relativeFilePath);

const isWithinWorkspace = (workspaceRoot: string, targetPath: string) => {
  const relativePath = path.relative(workspaceRoot, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
};

const isSupportedOperation = (operation: string): operation is RepairPatchOperation =>
  operation === "replace" || operation === "insert_before" || operation === "insert_after" || operation === "append";
