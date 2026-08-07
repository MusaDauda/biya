// The agent loop.
//
// Bounded on purpose, in three ways: a fixed maximum number of turns, a fixed
// tool set, and a hard rule that a tool failure is fed back as a message rather
// than thrown. A model that gets an argument wrong should be told and allowed
// to correct itself once; a model that cannot get it right in six turns is not
// going to on the seventh, and a stage demo must fail fast rather than hang.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getLLM } from "../llm/client.ts";
import { LLMUnavailableError, type ChatMessage } from "../llm/types.ts";
import {
  TOOLS_BY_NAME, ToolArgumentError, authorityFor, toolSchemas, validate,
  type ToolContext,
} from "./tools.ts";

const MAX_TURNS = 6;

export type AgentReply = {
  text: string;
  /** Anything the interface must render as a card rather than as prose. */
  proposals: Record<string, unknown>[];
  steps: { tool: string; authorizedBy: string; ok: boolean }[];
  sessionId: string;
  provider: string;
  model: string;
};

// The schema comments in the database carry the money model, so this stays
// short. It says who the user is, what the units are, and where the line is.
function systemPrompt(profile: {
  name: string;
  isBusiness: boolean;
  businessName?: string | null;
}): string {
  return [
    "You are the assistant inside Biya, a dollar account for Nigeria. The user holds US dollars and spends naira.",
    `You are speaking to ${profile.name}.`,
    profile.isBusiness
      ? `They run a business on Biya called ${profile.businessName ?? profile.name}.`
      : "They do not run a business on Biya, so business_summary will not help them.",
    "",
    "Amounts you SEND to a tool are in minor units. NGN is kobo: ₦1,200 is 120000 kobo.",
    "",
    // The model was reporting a ₦1,200 sale as "₦120,000". It is not asked to
    // divide any more: every tool returns the formatted string beside the raw
    // number, and the only rule is to copy it.
    "Amounts you SHOW the user must be copied from a field ending in _display. Those are already formatted.",
    "NEVER divide a _minor value yourself and never write a _minor number in a sentence.",
    "",
    "Never state a balance, a total or a transaction you have not read from a tool. If a tool has not told you, say you do not know.",
    "",
    "If a lookup comes back with \"ambiguous\": true you were not given user ids. Show the candidate names and ask which one. Do not guess.",
    "",
    "You cannot move money. propose_payment creates a request the user confirms with their PIN.",
    "Do not claim a payment has been sent. Say you have set it up for them to confirm.",
    "",
    "Answer in one or two short sentences. This is a phone screen, not a report.",
  ].join("\n");
}

export async function runAgent(opts: {
  db: SupabaseClient;
  userId: string;
  message: string;
  sessionId?: string;
  history?: ChatMessage[];
}): Promise<AgentReply> {
  const llm = getLLM();
  if (!llm) {
    throw new LLMUnavailableError("No model provider is configured", "none");
  }

  const { data: user, error: userErr } = await opts.db
    .from("app_users")
    .select("id, display_name, business_name, email, is_business")
    .eq("id", opts.userId)
    .maybeSingle();
  if (userErr || !user) throw new Error("Unknown user");

  // One session per conversation, so the audit log reads as a story rather than
  // as a pile of disconnected calls.
  let sessionId = opts.sessionId;
  if (!sessionId) {
    const { data, error } = await opts.db.rpc("start_agent_session", { p_user: opts.userId });
    if (error) throw new Error(error.message);
    sessionId = data as string;
  }

  const ctx: ToolContext = { db: opts.db, userId: opts.userId, sessionId: sessionId! };

  const name =
    user.business_name?.trim() || user.display_name?.trim() || user.email.split("@")[0];

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPrompt({
        name,
        isBusiness: user.is_business,
        businessName: user.business_name,
      }),
    },
    ...(opts.history ?? []),
    { role: "user", content: opts.message },
  ];

  const proposals: Record<string, unknown>[] = [];
  const steps: AgentReply["steps"] = [];
  let provider = llm.id;
  let model = llm.model;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const result = await llm.chat({ messages, tools: toolSchemas() });
    provider = result.provider;
    model = result.model;

    if (!result.toolCalls.length) {
      return {
        text: result.text?.trim() || "I am not sure how to help with that one.",
        proposals, steps, sessionId: sessionId!, provider, model,
      };
    }

    messages.push({
      role: "assistant",
      content: result.text,
      toolCalls: result.toolCalls,
    });

    for (const call of result.toolCalls) {
      const started = Date.now();
      const tool = TOOLS_BY_NAME.get(call.name);

      // An unknown tool name is not an error worth crashing on. Tell the model
      // and let it pick again from the list it already has.
      if (!tool) {
        messages.push({
          role: "tool",
          name: call.name,
          toolCallId: call.id,
          content: JSON.stringify({
            error: `No tool called ${call.name}. Available: ${[...TOOLS_BY_NAME.keys()].join(", ")}`,
          }),
        });
        steps.push({ tool: call.name, authorizedBy: "rejected", ok: false });
        continue;
      }

      const authority = authorityFor(tool);
      let payload: unknown;
      let failure: string | null = null;

      try {
        const args = validate(tool, call.arguments);
        payload = await tool.handler(ctx, args);
        if (tool.interactive && payload && typeof payload === "object") {
          proposals.push(payload as Record<string, unknown>);
        }
      } catch (err) {
        failure =
          err instanceof ToolArgumentError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Tool failed";
        payload = { error: failure };
      }

      // Logged whether it worked or not. A refusal is exactly the kind of line
      // a user wants to find in the audit log.
      await opts.db.rpc("log_agent_action", {
        p_session: sessionId,
        p_tool: tool.name,
        p_args: call.arguments,
        p_result: failure ? null : (payload as any),
        p_authorized_by: authority,
        p_error: failure,
        p_latency_ms: Date.now() - started,
      });

      steps.push({ tool: tool.name, authorizedBy: authority, ok: !failure });
      messages.push({
        role: "tool",
        name: tool.name,
        toolCallId: call.id,
        content: JSON.stringify(payload),
      });
    }
  }

  return {
    text: "I could not work that out. Try asking a simpler way.",
    proposals, steps, sessionId: sessionId!, provider, model,
  };
}
