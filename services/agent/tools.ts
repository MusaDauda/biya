// The complete set of things the assistant can do.
//
// This file is the authority boundary. Not the prompt, not the model, not the
// provider. If a capability is not in this array, no sequence of words from a
// user or a model can produce it, because the dispatcher looks up the tool by
// name in this array and refuses anything it does not find.
//
// Every handler calls a security-definer Postgres function with fixed
// arguments. There is no SQL string anywhere below, and the agent process holds
// no query interface, so "prompt injection makes it run arbitrary SQL" is not a
// question that has anywhere to land.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolDef } from "../llm/types.ts";

/** What authority a tool call ran under. Written to agent_actions verbatim. */
export type Authority = "read_only" | "user_pin" | `mandate:${string}`;

export type ToolContext = {
  db: SupabaseClient;
  userId: string;
  sessionId: string;
};

export type BiyaTool = ToolDef & {
  /** Declared, not inferred. A read tool can never quietly become a write one. */
  tier: "read" | "propose" | "mandate";
  /**
   * True when the result should be surfaced to the user as an interactive card
   * rather than folded into prose. Only proposals set this today.
   */
  interactive?: boolean;
  handler: (ctx: ToolContext, args: Record<string, unknown>) => Promise<unknown>;
};

/** Unwraps a supabase rpc call, turning a Postgres RAISE into a plain Error. */
async function rpc(ctx: ToolContext, fn: string, args: Record<string, unknown>) {
  const { data, error } = await ctx.db.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// Argument validation.
//
// Runs BEFORE dispatch, on every call, against the same schema the model was
// given. Models routinely send "1200" where an integer was asked for, or
// "1,200", or a float. Coercing here rather than in the RPC keeps the money
// path free of defensive parsing.
// ---------------------------------------------------------------------------

export class ToolArgumentError extends Error {}

function coerceInteger(value: unknown, field: string): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (!Number.isInteger(value)) {
      throw new ToolArgumentError(
        `${field} must be a whole number of minor units, got ${value}`,
      );
    }
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[,\s_₦$]/g, "");
    if (/^-?\d+$/.test(cleaned)) return Number(cleaned);
  }
  throw new ToolArgumentError(`${field} must be an integer, got ${JSON.stringify(value)}`);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validate(tool: BiyaTool, raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const props = tool.parameters.properties as Record<string, any>;

  for (const name of tool.parameters.required ?? []) {
    if (raw[name] === undefined || raw[name] === null || raw[name] === "") {
      throw new ToolArgumentError(`${tool.name} needs ${name}`);
    }
  }

  for (const [name, spec] of Object.entries(props)) {
    const value = raw[name];
    if (value === undefined || value === null) continue;

    if (spec.type === "integer") out[name] = coerceInteger(value, name);
    else if (spec.format === "uuid") {
      const s = String(value).trim();
      if (!UUID.test(s)) {
        throw new ToolArgumentError(
          `${name} must be a user id from ai_find_payee, not a name. Got "${s}".`,
        );
      }
      out[name] = s;
    } else out[name] = String(value);
  }

  return out;
}

// ---------------------------------------------------------------------------
// TIER 1: read. Always allowed.
// ---------------------------------------------------------------------------

export const TOOLS: BiyaTool[] = [
  {
    name: "get_balances",
    tier: "read",
    description: "The user's balances: spendable USD, spendable NGN, saved USD. Minor units.",
    parameters: { type: "object", properties: {}, required: [] },
    handler: (ctx) => rpc(ctx, "ai_get_balances", { p_user: ctx.userId }),
  },
  {
    name: "list_transactions",
    tier: "read",
    description: "Recent transactions, newest first. Negative means money left the user.",
    parameters: {
      type: "object",
      properties: {
        days: { type: "integer", description: "How far back to look. Default 7, max 365." },
        limit: { type: "integer", description: "How many to return. Default 20, max 100." },
      },
      required: [],
    },
    handler: (ctx, a) =>
      rpc(ctx, "ai_list_transactions", {
        p_user: ctx.userId,
        p_days: a.days ?? 7,
        p_limit: a.limit ?? 20,
      }),
  },
  {
    name: "spending_summary",
    tier: "read",
    description:
      "Totals by counterparty and by day, with each counterparty's category. Use for 'how much did I spend on food this week' instead of adding transactions up yourself.",
    parameters: {
      type: "object",
      properties: { days: { type: "integer", description: "Default 7, max 365." } },
      required: [],
    },
    handler: (ctx, a) =>
      rpc(ctx, "ai_spending_summary", { p_user: ctx.userId, p_days: a.days ?? 7 }),
  },
  {
    name: "get_goals",
    tier: "read",
    description: "The user's auto-save percentage and what they have set aside so far.",
    parameters: { type: "object", properties: {}, required: [] },
    handler: (ctx) => rpc(ctx, "ai_get_goals", { p_user: ctx.userId }),
  },
  {
    name: "find_payee",
    tier: "read",
    description:
      "Find who to pay, by name or 10-digit Biya code. Returns candidates with user ids. Call this before propose_payment. If more than one matches, ask which; never guess.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "A name or a 10-digit code." } },
      required: ["query"],
    },
    handler: (ctx, a) => rpc(ctx, "ai_find_payee", { p_query: a.query }),
  },
  {
    name: "business_summary",
    tier: "read",
    description: "Sales by day for the user's business, plus what it sells.",
    parameters: {
      type: "object",
      properties: { days: { type: "integer", description: "Default 7, max 365." } },
      required: [],
    },
    handler: (ctx, a) =>
      rpc(ctx, "ai_business_summary", { p_user: ctx.userId, p_days: a.days ?? 7 }),
  },

  // -------------------------------------------------------------------------
  // TIER 2: propose. The human confirms with a PIN.
  //
  // Read what this returns. It is a row in payment_proposals and a note saying
  // nothing moved. The FX quote is not even created here: that happens when the
  // user taps Confirm, so the 90 second rate window starts when a human is
  // looking at it rather than while a model was still thinking.
  // -------------------------------------------------------------------------
  {
    name: "propose_payment",
    tier: "propose",
    interactive: true,
    description:
      "Propose a payment. Does NOT move money; the user must confirm with their PIN. Amount in NGN kobo: ₦1,200 is 120000. Get payee_user_id from find_payee first.",
    parameters: {
      type: "object",
      properties: {
        payee_user_id: {
          type: "string",
          // Enforced in validate(), not here. See PROVIDER_UNSAFE_KEYWORDS.
          format: "uuid",
          description: "User id from find_payee. Not a name.",
        },
        ngn_minor: { type: "integer", description: "NGN kobo. ₦1,200 is 120000." },
        reason: { type: "string", description: "Short reason, in the user's words." },
      },
      required: ["payee_user_id", "ngn_minor"],
    },
    handler: (ctx, a) =>
      rpc(ctx, "ai_propose_payment", {
        p_session: ctx.sessionId,
        p_payer: ctx.userId,
        p_payee: a.payee_user_id,
        p_ngn_minor: a.ngn_minor,
        p_reason: a.reason ?? null,
      }),
  },
];

export const TOOLS_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

/**
 * Keywords we use for our own validation but must not send to a provider.
 *
 * Providers that constrain decoding against the schema also VALIDATE the
 * model's output against it, and they do not all implement the full JSON Schema
 * vocabulary. Groq rejects a whole turn with "parameters for tool
 * propose_payment did not match schema" when `format: "uuid"` is present, which
 * killed the one tool that matters. The requirement has not gone away; it moved
 * to validate(), which is where it was actually being enforced anyway.
 */
const PROVIDER_UNSAFE_KEYWORDS = ["format"];

/** What we send the provider. Strips handler, tier, and anything above. */
export function toolSchemas(): ToolDef[] {
  return TOOLS.map(({ name, description, parameters }) => {
    const properties: Record<string, unknown> = {};
    for (const [key, spec] of Object.entries(parameters.properties as Record<string, any>)) {
      const clean = { ...spec };
      for (const keyword of PROVIDER_UNSAFE_KEYWORDS) delete clean[keyword];
      properties[key] = clean;
    }
    return { name, description, parameters: { ...parameters, properties } };
  });
}

export function authorityFor(tool: BiyaTool): Authority {
  return tool.tier === "read" ? "read_only" : "user_pin";
}
