// OpenAI-wire-format client, plus the failover wrapper.
//
// The interesting work here is not talking to the API, it is smoothing over how
// differently providers behave when asked for tools. Some return proper
// `tool_calls`. Some return a JSON blob as ordinary text. Some emit arguments
// that are almost JSON. All of that gets normalised into one shape before
// anything downstream sees it.

import OpenAI from "openai";
import {
  type ChatRequest, type ChatResult, type LLMClient, type ToolCall,
  LLMUnavailableError,
} from "./types.ts";
import { type ResolvedProvider, resolveProviders, describeProviders } from "./providers.ts";

/** Tolerant argument parsing. A model that emits slightly broken JSON is normal. */
function parseArguments(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string") return {};

  const text = raw.trim();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    // Some providers wrap arguments in a fenced block, or append prose.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced?.[1] ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return {};
    }
  }
}

/**
 * A few models answer a tool request in plain text rather than using the
 * tool_calls field. Recover the common shape rather than losing the turn.
 */
function toolCallsFromText(text: string | null, knownNames: Set<string>): ToolCall[] {
  if (!text) return [];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced?.[1] ?? text;
  if (!body.includes("{")) return [];

  try {
    const parsed = JSON.parse(body.slice(body.indexOf("{"), body.lastIndexOf("}") + 1));
    const name = parsed.name ?? parsed.tool ?? parsed.function;
    if (typeof name === "string" && knownNames.has(name)) {
      return [{
        id: `recovered_${Date.now()}`,
        name,
        arguments: parseArguments(parsed.arguments ?? parsed.parameters ?? parsed.args ?? {}),
      }];
    }
  } catch {
    // Not a tool call. Ordinary prose.
  }
  return [];
}

/**
 * Some providers validate the model's tool call server side and return 400 when
 * the model produced something malformed. That is not a bad request from us and
 * not an outage: it is the model fumbling one generation, and the same call
 * usually succeeds on the next attempt.
 *
 * Observed on Groq with llama-3.3-70b: identical requests, seconds apart, one
 * fine and one rejected. Failing the whole turn over that would put a coin flip
 * in the middle of a live demo.
 */
function isToolGenerationFailure(err: unknown): boolean {
  if ((err as any)?.status !== 400) return false;
  const text = String((err as any)?.message ?? "");

  // Observed shapes, all of them the model fumbling one generation:
  //   "Failed to call a function. Please adjust your prompt."
  //   "tool call validation failed: parameters ... did not match schema"
  //   "attempted to call tool 'find_payee {\"query\": \"...\"}' which was not
  //    in request.tools"   <- arguments pasted into the function NAME
  return /failed to call a function|tool_use_failed|failed_generation|tool call validation failed|was not in request\.tools/i
    .test(text);
}

/**
 * Free and low tiers cap tokens per minute, and a tool-calling loop burns that
 * fast because the whole tool list is resent on every turn. Providers say how
 * long to wait, either in a Retry-After header or in the message itself. Waiting
 * the stated time beats failing the turn: a two second pause is invisible on
 * stage, an error is not.
 */
function rateLimitDelayMs(err: unknown): number | null {
  if ((err as any)?.status !== 429) return null;

  const header = (err as any)?.headers?.["retry-after"];
  if (header && !Number.isNaN(Number(header))) return Math.ceil(Number(header) * 1000);

  // Providers write this several ways: "4.21s", "13m17.472s", "in 60 seconds".
  // Parsing only the seconds would read a thirteen minute wait as thirteen, and
  // we would sit in a retry loop that cannot succeed.
  const stated = String((err as any)?.message ?? "")
    .match(/try again in\s+(?:(\d+)\s*m)?\s*([\d.]+)\s*s/i);
  if (stated) {
    const minutes = Number(stated[1] ?? 0);
    const seconds = Number(stated[2] ?? 0);
    return Math.ceil((minutes * 60 + seconds) * 1000) + 250;
  }

  return 2000;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Each generation fumbles independently, so a third attempt is cheap insurance
// against a coin flip landing badly in front of judges.
const TOOL_RETRIES = 3;
/** Waiting longer than this on stage is worse than degrading. */
const MAX_RATE_LIMIT_WAIT_MS = 8000;

class OpenAICompatibleClient implements LLMClient {
  readonly id: string;
  readonly model: string;
  private client: OpenAI;

  constructor(provider: ResolvedProvider) {
    this.id = provider.id;
    this.model = provider.model;
    this.client = new OpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseURL,
      defaultHeaders: provider.headers,
      maxRetries: 1,
      timeout: 30_000,
    });
  }

  async chat(request: ChatRequest): Promise<ChatResult> {
    const started = Date.now();

    const messages = request.messages.map((m) => {
      if (m.role === "tool") {
        return { role: "tool" as const, content: m.content ?? "", tool_call_id: m.toolCallId! };
      }
      if (m.role === "assistant" && m.toolCalls?.length) {
        return {
          role: "assistant" as const,
          // An assistant turn that only calls tools has no text. OpenAI accepts
          // "" there; a Claude model behind an Anthropic-shaped proxy (seen via
          // tokenrouter) rejects an empty text block outright, with "text
          // content blocks must be non-empty". Omitting the field when there is
          // truly nothing to say satisfies both.
          ...(m.content ? { content: m.content } : {}),
          tool_calls: m.toolCalls.map((t) => ({
            id: t.id,
            type: "function" as const,
            function: { name: t.name, arguments: JSON.stringify(t.arguments) },
          })),
        };
      }
      return { role: m.role as "system" | "user" | "assistant", content: m.content ?? "" };
    });

    const body = {
      model: this.model,
      messages: messages as any,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens ?? 1024,
      ...(request.tools?.length
        ? {
            tools: request.tools.map((t) => ({
              type: "function" as const,
              function: { name: t.name, description: t.description, parameters: t.parameters },
            })),
            tool_choice: "auto" as const,
          }
        : {}),
    };

    let completion;
    let lastErr: unknown;

    for (let attempt = 0; attempt <= TOOL_RETRIES; attempt++) {
      try {
        completion = await this.client.chat.completions.create(body);
        break;
      } catch (err) {
        lastErr = err;
        if (attempt === TOOL_RETRIES) break;

        const wait = rateLimitDelayMs(err);
        if (wait !== null) {
          if (wait > MAX_RATE_LIMIT_WAIT_MS) break;
          console.warn(`[llm] ${this.id} rate limited, waiting ${wait}ms`);
          await sleep(wait);
          continue;
        }

        if (!isToolGenerationFailure(err)) break;
        // Nudge the sampler rather than resending an identical request that has
        // already been shown to produce a malformed call.
        body.temperature = Math.min(1, (body.temperature ?? 0.2) + 0.3);
        console.warn(`[llm] ${this.id} produced a malformed tool call, retrying`);
      }
    }

    if (!completion) {
      throw new LLMUnavailableError(
        lastErr instanceof Error ? lastErr.message : "provider call failed",
        this.id,
      );
    }

    const choice = completion.choices?.[0];
    const text = choice?.message?.content ?? null;

    let toolCalls: ToolCall[] = (choice?.message?.tool_calls ?? [])
      .filter((c: any) => c.type === "function" || c.function)
      .map((c: any) => ({
        id: c.id ?? `call_${Math.random().toString(36).slice(2)}`,
        name: c.function.name,
        arguments: parseArguments(c.function.arguments),
      }));

    if (!toolCalls.length && request.tools?.length) {
      toolCalls = toolCallsFromText(text, new Set(request.tools.map((t) => t.name)));
    }

    return {
      text,
      toolCalls,
      provider: this.id,
      model: this.model,
      latencyMs: Date.now() - started,
    };
  }
}

/**
 * Tries each configured provider in order. Only a transport or provider failure
 * moves to the next one; a successful call that simply produced a poor answer
 * is still an answer.
 */
class FailoverClient implements LLMClient {
  readonly id: string;
  readonly model: string;

  constructor(private clients: LLMClient[]) {
    this.id = clients.map((c) => c.id).join("|");
    this.model = clients[0]?.model ?? "none";
  }

  async chat(request: ChatRequest): Promise<ChatResult> {
    let last: unknown;
    for (const client of this.clients) {
      try {
        return await client.chat(request);
      } catch (err) {
        last = err;
        console.warn(`[llm] ${client.id} failed, trying next:`,
          err instanceof Error ? err.message : err);
      }
    }
    throw new LLMUnavailableError(
      last instanceof Error ? last.message : "no provider answered",
      this.id,
    );
  }
}

let cached: LLMClient | null | undefined;

/** Null when nothing is configured. Callers should degrade, not crash. */
export function getLLM(): LLMClient | null {
  if (cached !== undefined) return cached;
  const providers = resolveProviders();
  if (!providers.length) {
    console.warn("[llm] no provider configured; the assistant is switched off");
    cached = null;
    return null;
  }
  console.log(`[llm] ${describeProviders(providers)}`);
  cached = new FailoverClient(providers.map((p) => new OpenAICompatibleClient(p)));
  return cached;
}

/** For tests that need to change environment between calls. */
export function resetLLM(): void {
  cached = undefined;
}
