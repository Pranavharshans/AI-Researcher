import { OpenRouterProvider } from "@/server/model/providers/openrouter";
import type { ModelClient } from "@/server/model/types";

export type ModelProviderName = "openrouter";

export type ModelProviderConfig = {
  provider: ModelProviderName;
  model: string;
  hasApiKey: boolean;
};

const fallbackOpenRouterModel = "openrouter/auto";

export const getModelProviderConfig = (): ModelProviderConfig => ({
  provider: "openrouter",
  model: process.env.OPENROUTER_MODEL ?? fallbackOpenRouterModel,
  hasApiKey: Boolean(process.env.OPENROUTER_API_KEY)
});

export const createModelClient = (): ModelClient => {
  const config = getModelProviderConfig();

  return new OpenRouterProvider({
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultModel: config.model,
    appName: "Agentic LaTeX Diagram Editor",
    appUrl: process.env.NEXT_PUBLIC_APP_URL
  });
};
