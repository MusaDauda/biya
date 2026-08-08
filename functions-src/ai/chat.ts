// POST /api/ai/chat
//
// Vercel parses a JSON body onto req.body for Node functions automatically, so
// this stays a thin wrapper around the same runAgent() the standalone service
// process called. The provider key never reaches the browser either way.

import type { IncomingMessage, ServerResponse } from "http";
import { adminDb } from "../_db";
import { runAgent } from "../../services/agent/loop";
import { LLMUnavailableError } from "../../services/llm/types";

type Req = IncomingMessage & { body?: any; method?: string };

export default async function handler(req: Req, res: ServerResponse) {
  res.setHeader("content-type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "POST only" }));
    return;
  }

  const body = req.body ?? {};
  const { userId, message, sessionId, history } = body;
  if (!userId || typeof message !== "string" || !message.trim()) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "userId and message are required" }));
    return;
  }
  if (message.length > 2000) {
    res.statusCode = 413;
    res.end(JSON.stringify({ error: "That message is too long" }));
    return;
  }

  try {
    const reply = await runAgent({
      db: adminDb(),
      userId,
      message: message.trim(),
      sessionId: sessionId ?? undefined,
      history: Array.isArray(history) ? history.slice(-10) : undefined,
    });
    res.end(JSON.stringify(reply));
  } catch (err) {
    if (err instanceof LLMUnavailableError) {
      res.statusCode = 503;
      res.end(JSON.stringify({
        error: "The assistant is unreachable right now. Everything else still works.",
      }));
      return;
    }
    const msg = err instanceof Error ? err.message : "Something went wrong";
    console.error("[ai]", msg);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: msg }));
  }
}
