// USD/NGN rate feed.
//
// Biya quotes the BANK rate: the rate you would get on a card, not a parallel
// market number. That is a deliberate positioning choice, and it is why
// `rate_type` is written on every row rather than assumed.
//
// There is no hardcoded rate anywhere. If every source fails we write nothing,
// the newest row ages out, and create_fx_quote starts refusing. Refusing to
// quote is correct behaviour; quoting yesterday's number is not.

import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } },
);

export type RateReading = { mid: number; source: string };

type Source = { name: string; url: string; pick: (json: any) => number | undefined };

// Both are free and need no key. Ordered by preference.
const SOURCES: Source[] = [
  {
    name: "open.er-api.com",
    url: "https://open.er-api.com/v6/latest/USD",
    pick: (j) => (j?.result === "success" ? j?.rates?.NGN : undefined),
  },
  {
    name: "fawazahmed0/currency-api",
    url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
    pick: (j) => j?.usd?.ngn,
  },
];

async function tryOne(source: Source, timeoutMs = 10_000): Promise<RateReading | null> {
  const abort = AbortSignal.timeout(timeoutMs);
  try {
    const res = await fetch(source.url, { signal: abort });
    if (!res.ok) return null;
    const mid = source.pick(await res.json());
    // A plausibility floor. A feed returning 1.0 or 0 has broken in a way that
    // would otherwise quietly credit someone a fortune.
    if (typeof mid !== "number" || !Number.isFinite(mid) || mid < 100) return null;
    return { mid, source: source.name };
  } catch {
    return null;
  }
}

/** First source that answers with a plausible number wins. */
export async function fetchRate(): Promise<RateReading | null> {
  for (const source of SOURCES) {
    const reading = await tryOne(source);
    if (reading) return reading;
  }
  return null;
}

export async function recordRate(reading: RateReading): Promise<void> {
  const { error } = await db.rpc("record_fx_rate", {
    p_mid: reading.mid,
    p_source: reading.source,
    p_rate_type: "bank",
  });
  if (error) throw new Error(`could not record rate: ${error.message}`);
}

/** Fetch once and store. Returns what was stored, or null if every source failed. */
export async function refreshRate(): Promise<RateReading | null> {
  const reading = await fetchRate();
  if (!reading) {
    console.warn("[fx] every source failed; not writing a rate");
    return null;
  }
  await recordRate(reading);
  console.log(`[fx] USD/NGN ${reading.mid.toFixed(4)} from ${reading.source}`);
  return reading;
}

export function startRatePoller(intervalMs = 10 * 60_000): () => void {
  refreshRate().catch((e) => console.error("[fx]", e.message));
  const timer = setInterval(
    () => refreshRate().catch((e) => console.error("[fx]", e.message)),
    intervalMs,
  );
  return () => clearInterval(timer);
}
