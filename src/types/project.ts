export type ProjectFile = {
  id: string;
  path: string;
  language: "latex" | "bibtex" | "plain";
  content: string;
};

export type CompileState = "idle" | "queued" | "running" | "success" | "error";

export type AgentEvent = {
  id: string;
  label: string;
  detail: string;
  state: "complete" | "current" | "pending" | "warning";
};

export type DiagramPreviewStatus = "ready" | "kept" | "changes-requested" | "discarded";

export type DiagramPreviewApproval = {
  id: string;
  prompt: string;
  artifactPath: string;
  sourcePath: string;
  source: string;
  accessibleSummary: string;
  repairSummary: string;
  changes: string[];
  revisionHistory: string[];
  status: DiagramPreviewStatus;
};
