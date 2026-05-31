import { modelTaskDescriptions } from "@/server/model/task-schemas";
import type { ModelClient, ModelRequest, ModelResponse } from "@/server/model/types";
import { ModelProviderError } from "@/server/model/types";

type OpenRouterProviderOptions = {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  appName?: string;
  appUrl?: string;
  fetchImpl?: typeof fetch;
};

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenRouterRequestBody = {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict: boolean;
      schema: Record<string, unknown>;
    };
  };
  metadata?: Record<string, string>;
};

type OpenRouterChoice = {
  message?: {
    content?: string;
  };
};

type OpenRouterResponseBody = {
  id?: string;
  model?: string;
  choices?: OpenRouterChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

const defaultBaseUrl = "https://openrouter.ai/api/v1";
const defaultModel = "openrouter/auto";

export const createOpenRouterRequestBody = (request: ModelRequest, defaultProviderModel = defaultModel): OpenRouterRequestBody => {
  const model = request.model ?? defaultProviderModel;
  const systemMessage: OpenRouterMessage = {
    role: "system",
    content: createSystemPrompt(request)
  };

  const body: OpenRouterRequestBody = {
    model,
    messages: [systemMessage, ...request.messages],
    metadata: {
      task: request.task,
      ...(request.metadata ?? {})
    }
  };

  if (typeof request.temperature === "number") {
    body.temperature = request.temperature;
  }

  if (typeof request.maxTokens === "number") {
    body.max_tokens = request.maxTokens;
  }

  if (request.responseSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: request.responseSchema.name,
        strict: request.responseSchema.strict ?? true,
        schema: request.responseSchema.schema
      }
    };
  }

  return body;
};

const createSystemPrompt = (request: ModelRequest) => {
  const taskDescription = `Task: ${request.task}. ${modelTaskDescriptions[request.task]}`;

  if (request.task === "generate_diagram_source") {
    return [
      "You generate LaTeX diagrams for an editor.",
      "Return only raw LaTeX/TikZ source.",
      "Do not return markdown fences, JSON, explanations, captions, prose, comments, or surrounding text.",
      "The first non-whitespace characters must be \\begin{tikzpicture}.",
      "The final non-whitespace characters must be \\end{tikzpicture}.",
      taskDescription
    ].join(" ");
  }

  return [
    "You are the model layer for an agentic LaTeX diagram editor.",
    request.responseSchema ? "Return only outputs matching the requested schema." : "Return only the requested content.",
    taskDescription
  ].join(" ");
};

export class OpenRouterProvider implements ModelClient {
  readonly provider = "openrouter";
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly appName?: string;
  private readonly appUrl?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenRouterProviderOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? defaultBaseUrl;
    this.defaultModel = options.defaultModel ?? defaultModel;
    this.appName = options.appName;
    this.appUrl = options.appUrl;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async complete(request: ModelRequest): Promise<ModelResponse> {
    if (!this.apiKey) {
      throw new ModelProviderError("OpenRouter API key is not configured.", "missing_api_key");
    }

    const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.createHeaders(),
      body: JSON.stringify(createOpenRouterRequestBody(request, this.defaultModel))
    });

    if (!response.ok) {
      const detail = await readOpenRouterErrorDetail(response);
      const message =
        response.status === 429
          ? "OpenRouter rate limit hit for the configured model/key."
          : `OpenRouter request failed with status ${response.status}.`;

      throw new ModelProviderError(message, "request_failed", response.status, detail);
    }

    const data = (await response.json()) as OpenRouterResponseBody;
    const content = data.choices?.[0]?.message?.content;

    if (!data.id || !content) {
      throw new ModelProviderError("OpenRouter returned an invalid completion response.", "invalid_response");
    }

    return {
      id: data.id,
      provider: this.provider,
      model: data.model ?? request.model ?? this.defaultModel,
      content,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens
      },
      raw: data
    };
  }

  private createHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json"
    };

    if (this.appName) {
      headers["X-Title"] = this.appName;
    }

    if (this.appUrl) {
      headers["HTTP-Referer"] = this.appUrl;
    }

    return headers;
  }
}

const readOpenRouterErrorDetail = async (response: Response) => {
  const text = await response.text().catch(() => "");

  if (!text) {
    return response.statusText;
  }

  try {
    const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string };

    return parsed.error?.message ?? parsed.message ?? text;
  } catch {
    return text;
  }
};
