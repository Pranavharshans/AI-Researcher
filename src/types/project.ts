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
