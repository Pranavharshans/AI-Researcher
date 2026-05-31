export type ModelTask =
  | "generate_diagram_source"
  | "diagnose_latex_error"
  | "plan_latex_patch"
  | "revise_diagram_from_user_feedback"
  | "summarize_agent_activity";

export type ModelMessageRole = "system" | "user" | "assistant";

export type ModelMessage = {
  role: ModelMessageRole;
  content: string;
};

export type ModelJsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type ModelRequest = {
  task: ModelTask;
  messages: ModelMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseSchema?: ModelJsonSchema;
  metadata?: Record<string, string>;
};

export type ModelUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costUsd?: number;
};

export type ModelResponse = {
  id: string;
  provider: string;
  model: string;
  content: string;
  usage?: ModelUsage;
  raw?: unknown;
};

export type ModelEvent =
  | {
      type: "content_delta";
      content: string;
    }
  | {
      type: "status";
      label: string;
    }
  | {
      type: "done";
      response: ModelResponse;
    };

export type ModelClient = {
  complete: (request: ModelRequest) => Promise<ModelResponse>;
  stream?: (request: ModelRequest) => AsyncIterable<ModelEvent>;
};

export class ModelProviderError extends Error {
  readonly code: "missing_api_key" | "request_failed" | "invalid_response";
  readonly detail?: string;
  readonly status?: number;

  constructor(message: string, code: ModelProviderError["code"], status?: number, detail?: string) {
    super(message);
    this.name = "ModelProviderError";
    this.code = code;
    this.detail = detail;
    this.status = status;
  }
}
