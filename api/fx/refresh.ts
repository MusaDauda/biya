// GET/POST /api/fx/refresh
//
// There is no long-lived process on Vercel to run the old poller's setInterval,
// so nothing else writes a new fx_rates row. Two things call this instead:
// the frontend, once per quote (see ensureFreshRate in src/lib/api.ts), and,
// if the Vercel plan allows scheduled functions, vercel.json's cron. Either
// is enough: create_fx_quote only cares that a row landed within the last
// hour, not who wrote it.

import type { IncomingMessage, ServerResponse } from "http";
import { refreshRate } from "../../services/fx";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader("content-type", "application/json");
  try {
    const reading = await refreshRate();
    if (!reading) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: "every rate source failed" }));
      return;
    }
    res.end(JSON.stringify(reading));
  } catch (err) {
    console.error("[fx/refresh]", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  }
}
