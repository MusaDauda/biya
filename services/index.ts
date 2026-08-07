// Biya services.
//
// Everything here is written so it could move into a Supabase Edge Function
// unchanged: configuration comes from the environment, there is no shared
// mutable module state, and nothing assumes a long-lived process except the
// pollers, which become pg_cron schedules in production.
//
//   npm run services

import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { createClient } from "@supabase/supabase-js";
import { refreshRate, startRatePoller } from "./fx.ts";
import { aiRoutes } from "./ai.ts";

const REQUIRED = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"] as const;
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

const app = new Hono();
app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true, service: "biya", at: new Date().toISOString() }));

/** What rate would we quote right now, and is it fresh enough to pay with. */
app.get("/fx/now", async (c) => {
  const { data, error } = await db.from("current_fx").select("*").maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ?? { error: "no rate yet" });
});

/** Force a refresh. Useful on stage when you want a visibly current rate. */
app.post("/fx/refresh", async (c) => {
  const reading = await refreshRate();
  if (!reading) return c.json({ error: "every rate source failed" }, 502);
  return c.json(reading);
});

// The assistant. Mounted here rather than in its own process because the
// provider key and the Supabase secret key already live in this one.
app.route("/ai", aiRoutes(db));

const port = Number(process.env.SERVICES_PORT ?? 8787);

const stopRates = startRatePoller();
serve({ fetch: app.fetch, port }, () => {
  console.log(`[biya] services on http://localhost:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    stopRates();
    process.exit(0);
  });
}
