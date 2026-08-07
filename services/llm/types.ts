// The entire provider surface for Biya.
//
// Nothing above this file knows which model or vendor is answering. Swapping
// Groq for OpenAI, OpenRouter, DeepSeek or a model on your own laptop is a
// change to environment variables, not to code.

export type Role = "system" | "user" | "assistant" | "tool";

export type ChatMessage = {
  role: Role;
  content: string | null;
  /** Present on assistant turns that asked for tools. */
  toolCalls?: ToolCall[];
  /** Present on tool turns: which call this is answering. */
  toolCallId?: string;
  /** Present on tool turns: the tool that ran. */
  name?: string;
};

export type ToolCall = {
  id: string;
  name: string;
  /** Already parsed and normalised. Never raw model output. */
  arguments: Record<string, unknown>;
};

/** A JSON-Schema-ish parameter description, sent to the provider verbatim. */
export type ToolSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

export type ToolDef = {
  name: string;
  description: string;
  parameters: ToolSchema;
};

export type ChatRequest = {
  messages: ChatMessage[];
  tools?: ToolDef[];
  temperature?: number;
  maxTokens?: number;
};

export type ChatResult = {
  text: string | null;
  toolCalls: ToolCall[];
  /** Which provider and model actually answered. Surfaced for the audit log. */
  provider: string;
  model: string;
  latencyMs: number;
};

/**
 * The seam. An OpenAI-wire-compatible implementation ships by default; a
 * provider that speaks a different protocol can implement this instead without
 * anything upstream noticing.
 */
export interface LLMClient {
  readonly id: string;
  readonly model: string;
  chat(request: ChatRequest): Promise<ChatResult>;
}

export class LLMUnavailableError extends Error {
  constructor(message: string, readonly provider: string) {
    super(message);
    this.name = "LLMUnavailableError";
  }
}
