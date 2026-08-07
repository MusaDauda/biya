// GET /api/ai/status
//
// Same contract as the standalone service's /ai/status. Runs as a Vercel Node
// function instead of a long-lived process, so it works from a static deploy
// with no server to keep alive.

import type { IncomingMessage, ServerResponse } from "http";
import { getLLM } from "../../services/llm/client.ts";
import { TOOLS } from "../../services/agent/tools.ts";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  const llm = getLLM();
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({
    configured: Boolean(llm),
    provider: llm?.id ?? null,
    model: llm?.model ?? null,
    tools: TOOLS.map((t) => ({ name: t.name, tier: t.tier })),
  }));
}
