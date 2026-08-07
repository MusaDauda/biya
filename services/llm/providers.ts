// Provider presets and environment resolution.
//
// To change model or vendor, set environment variables. Nothing else moves:
//
//   LLM_PROVIDER=groq
//   LLM_MODEL=llama-3.3-70b-versatile
//
// The key is read from LLM_API_KEY, or from the preset's conventional variable
// (GROQ_API_KEY, OPENAI_API_KEY, ...) so an existing key already in .env just
// works. A fallback provider can be named so a dead endpoint on venue wifi
// degrades to a second vendor instead of killing the assistant mid-demo:
//
//   LLM_FALLBACK_PROVIDER=openrouter
//   LLM_FALLBACK_MODEL=meta-llama/llama-3.3-70b-instruct

export type ProviderPreset = {
  id: string;
  baseURL: string;
  /** Environment variable this vendor conventionally uses for its key. */
  keyEnv: string;
  /** Sensible default so LLM_MODEL can be omitted. */
  defaultModel?: string;
  /** Local runtimes accept any non-empty string as a key. */
  keyOptional?: boolean;
  headers?: Record<string, string>;
};

// Anything speaking the OpenAI chat-completions wire format belongs here, which
// in practice is nearly everything. A vendor that does not can be added as a
// separate LLMClient implementation instead.
export const PRESETS: Record<string, ProviderPreset> = {
  groq: {
    id: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    keyEnv: "GROQ_API_KEY",
    defaultModel: "llama-3.3-70b-versatile",
  },
  openai: {
    id: "openai",
    baseURL: "https://api.openai.com/v1",
    keyEnv: "OPENAI_API_KEY",
    defaultModel: "gpt-4o-mini",
  },
  openrouter: {
    id: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    keyEnv: "OPENROUTER_API_KEY",
    defaultModel: "meta-llama/llama-3.3-70b-instruct",
  },
  // A router in front of several vendors. No default model on purpose: the id
  // depends on which upstreams the account has, so set LLM_MODEL explicitly.
  // Key is read from OPENAI_API_KEY because that is the convention the
  // TokenRouter dashboard hands out (it is an OpenAI-shaped client either way),
  // not because this is OpenAI itself.
  tokenrouter: {
    id: "tokenrouter",
    baseURL: "https://api.tokenrouter.com/v1",
    keyEnv: "OPENAI_API_KEY",
    // gpt-4o-mini and gpt-oss-120b both mis-selected the write tool in the
    // matrix test (npm run verify:llm). claude-haiku-4.5 was correct and
    // roughly twice as fast as gpt-5-mini, the other model that passed.
    defaultModel: "anthropic/claude-haiku-4.5",
  },
  together: {
    id: "together",
    baseURL: "https://api.together.xyz/v1",
    keyEnv: "TOGETHER_API_KEY",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  },
  fireworks: {
    id: "fireworks",
    baseURL: "https://api.fireworks.ai/inference/v1",
    keyEnv: "FIREWORKS_API_KEY",
  },
  deepseek: {
    id: "deepseek",
    baseURL: "https://api.deepseek.com/v1",
    keyEnv: "DEEPSEEK_API_KEY",
    defaultModel: "deepseek-chat",
  },
  xai: {
    id: "xai",
    baseURL: "https://api.x.ai/v1",
    keyEnv: "XAI_API_KEY",
  },
  mistral: {
    id: "mistral",
    baseURL: "https://api.mistral.ai/v1",
    keyEnv: "MISTRAL_API_KEY",
  },
  cerebras: {
    id: "cerebras",
    baseURL: "https://api.cerebras.ai/v1",
    keyEnv: "CEREBRAS_API_KEY",
  },
  // Anthropic exposes an OpenAI-compatible surface. Verify the model id and
  // that tool calling behaves before relying on it for a demo.
  anthropic: {
    id: "anthropic",
    baseURL: "https://api.anthropic.com/v1",
    keyEnv: "ANTHROPIC_API_KEY",
  },
  ollama: {
    id: "ollama",
    baseURL: "http://localhost:11434/v1",
    keyEnv: "OLLAMA_API_KEY",
    keyOptional: true,
    defaultModel: "llama3.1",
  },
  lmstudio: {
    id: "lmstudio",
    baseURL: "http://localhost:1234/v1",
    keyEnv: "LMSTUDIO_API_KEY",
    keyOptional: true,
  },
  vllm: {
    id: "vllm",
    baseURL: "http://localhost:8000/v1",
    keyEnv: "VLLM_API_KEY",
    keyOptional: true,
  },
};

export type ResolvedProvider = {
  id: string;
  baseURL: string;
  apiKey: string;
  model: string;
  headers?: Record<string, string>;
};

function resolveOne(
  providerName: string | undefined,
  modelOverride: string | undefined,
  explicitKey: string | undefined,
  explicitBaseUrl: string | undefined,
): ResolvedProvider | null {
  if (!providerName) return null;

  const name = providerName.trim().toLowerCase();
  const preset = PRESETS[name];

  // "custom" (or an unknown name) is legitimate as long as a base URL is given.
  // This is what makes a brand new vendor a config change rather than a PR.
  const baseURL = explicitBaseUrl || preset?.baseURL;
  if (!baseURL) return null;

  const apiKey =
    explicitKey ||
    (preset ? process.env[preset.keyEnv] : undefined) ||
    process.env[`${name.toUpperCase()}_API_KEY`] ||
    (preset?.keyOptional ? "local" : "");

  if (!apiKey) return null;

  const model = modelOverride || preset?.defaultModel;
  if (!model) return null;

  return { id: name, baseURL, apiKey, model, headers: preset?.headers };
}

/**
 * Providers to try, in order. Usually one; two when a fallback is configured.
 * Returns an empty array when nothing is configured, which callers should treat
 * as "the assistant is switched off" rather than as an error.
 */
export function resolveProviders(): ResolvedProvider[] {
  const primary = resolveOne(
    process.env.LLM_PROVIDER ?? (process.env.GROQ_API_KEY ? "groq" : undefined),
    process.env.LLM_MODEL ?? process.env.GROQ_MODEL,
    process.env.LLM_API_KEY,
    process.env.LLM_BASE_URL,
  );

  const fallback = resolveOne(
    process.env.LLM_FALLBACK_PROVIDER,
    process.env.LLM_FALLBACK_MODEL,
    process.env.LLM_FALLBACK_API_KEY,
    process.env.LLM_FALLBACK_BASE_URL,
  );

  return [primary, fallback].filter((p): p is ResolvedProvider => p !== null);
}

export function describeProviders(providers: ResolvedProvider[]): string {
  if (!providers.length) return "none configured";
  return providers.map((p) => `${p.id}:${p.model}`).join(" then ");
}
