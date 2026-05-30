import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const types = readFileSync("src/server/model/types.ts", "utf8");
const provider = readFileSync("src/server/model/providers/openrouter.ts", "utf8");
const schemas = readFileSync("src/server/model/task-schemas.ts", "utf8");
const config = readFileSync("src/server/model/config.ts", "utf8");
const envExample = readFileSync(".env.example", "utf8");
const index = readFileSync("src/server/model/index.ts", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

assert.match(types, /export type ModelClient/, "ModelClient type must be exported");
assert.match(types, /complete: \(request: ModelRequest\) => Promise<ModelResponse>/, "ModelClient must expose complete(request)");
assert.match(types, /stream\?: \(request: ModelRequest\) => AsyncIterable<ModelEvent>/, "ModelClient must allow optional streaming");
assert.match(types, /generate_diagram_source/, "Model tasks must include diagram source generation");
assert.match(types, /diagnose_latex_error/, "Model tasks must include diagnosis");
assert.match(types, /plan_latex_patch/, "Model tasks must include patch planning");
assert.match(types, /revise_diagram_from_user_feedback/, "Model tasks must include revision");
assert.match(types, /summarize_agent_activity/, "Model tasks must include summarization");
assert.match(schemas, /modelTaskSchemas/, "Each model task must have an explicit schema registry");
assert.match(provider, /class OpenRouterProvider implements ModelClient/, "OpenRouterProvider must sit behind ModelClient");
assert.match(provider, /OpenRouter API key is not configured/, "OpenRouterProvider must fail clearly without an API key");
assert.match(provider, /https:\/\/openrouter\.ai\/api\/v1/, "OpenRouterProvider must target the OpenRouter API gateway");
assert.match(provider, /openrouter\/auto/, "OpenRouterProvider should default to the documented OpenRouter auto router");
assert.match(provider, /createOpenRouterRequestBody/, "OpenRouter requests must be normalized separately from transport");
assert.match(provider, /response_format/, "OpenRouter request body must support structured output schemas");
assert.match(config, /OPENROUTER_API_KEY/, "Provider config must read the OpenRouter API key from environment");
assert.match(config, /createModelClient/, "A provider-neutral client factory must exist");
assert.match(envExample, /OPENROUTER_API_KEY=/, "Environment example must document the OpenRouter API key");
assert.match(envExample, /OPENROUTER_MODEL=openrouter\/auto/, "Environment example must document the default OpenRouter model");
assert.match(index, /OpenRouterProvider/, "Model index must export the OpenRouter provider");
assert.doesNotMatch(readFileSync("src/components/project-shell.tsx", "utf8"), /server\/model/, "Client UI must not import server-side model providers");
assert.match(packageJson.scripts.test, /task-010-model-provider/, "TASK-010 checks must run in npm test");

console.log("TASK-010 model provider checks passed");
