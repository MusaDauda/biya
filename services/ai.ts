// The assistant endpoint.
//
// This exists as a server route for one reason: the provider key must not be in
// the browser bundle. Everything else here is thin. The authority rules live in
// agent/tools.ts and in Postgres, not in this file, so an attacker who reached
// this endpoint would still only be able to do what the tool list allows.

import { Hono } from "hono";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runAgent } from "./agent/loop.ts";
import { TOOLS } from "./agent/tools.ts";
import { getLLM } from "./llm/client.ts";
import { LLMUnavailableError } from "./llm/types.ts";

export function aiRoutes(db: SupabaseClient) {
  const app = new Hono();

  /** Is the assistant switched on, and what is answering. */
  app.get("/status", (c) => {
    const llm = getLLM();
    return c.json({
      configured: Boolean(llm),
      provider: llm?.id ?? null,
      model: llm?.model ?? null,
      tools: TOOLS.map((t) => ({ name: t.name, tier: t.tier })),
    });
  });

  app.post("/chat", async (c) => {
    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Expected JSON" }, 400);
    }

    const { userId, message, sessionId, history } = body ?? {};
    if (!userId || typeof message !== "string" || !message.trim()) {
      return c.json({ error: "userId and message are required" }, 400);
    }
    if (message.length > 2000) {
      return c.json({ error: "That message is too long" }, 413);
    }

    try {
      const reply = await runAgent({
        db,
        userId,
        message: message.trim(),
        sessionId: sessionId ?? undefined,
        history: Array.isArray(history) ? history.slice(-10) : undefined,
      });
      return c.json(reply);
    } catch (err) {
      if (err instanceof LLMUnavailableError) {
        // Degrade honestly. On venue wifi this is the likely failure and the
        // user should be told the assistant is down, not shown a fake answer.
        return c.json(
          { error: "The assistant is unreachable right now. Everything else still works." },
          503,
        );
      }
      const msg = err instanceof Error ? err.message : "Something went wrong";
      console.error("[ai]", msg);
      return c.json({ error: msg }, 500);
    }
  });

  return app;
}
