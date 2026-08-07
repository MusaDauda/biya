// Shared Supabase admin client for serverless functions.
//
// Vercel runs each api/*.ts as its own isolated function, so this file has no
// long-lived state to share across requests. A fresh client per cold start is
// the same cost the standalone `services` process paid per restart.

import { createClient } from "@supabase/supabase-js";

export function adminDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
