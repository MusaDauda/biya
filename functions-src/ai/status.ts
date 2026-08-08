// GET /api/ai/status
//
// Same contract as the standalone service's /ai/status. Runs as a Vercel Node
// function instead of a long-lived process, so it works from a static deploy
// with no server to keep alive.

import type { IncomingMessage, ServerResponse } from "http";
import { getLLM } from "../../services/llm/client";
import { TOOLS } from "../../services/agent/tools";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader("content-type", "application/json");
  try {
    const llm = getLLM();
    res.end(JSON.stringify({
      configured: Boolean(llm),
      provider: llm?.id ?? null,
      model: llm?.model ?? null,
      tools: TOOLS.map((t) => ({ name: t.name, tier: t.tier })),
    }));
  } catch (err) {
    // Surfaced rather than left as an opaque platform 500, so a misconfigured
    // deploy is diagnosable from the response body alone.
    console.error("[ai/status]", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  }
}
