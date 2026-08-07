// Per-user deposit address. Generated in the browser, never sent as a key.
//
// SCOPE, on purpose: this gives every user a real, unique EVM address to show
// on the Stablecoin screen. It does NOT include a listener: nothing watches
// this address for a transfer and nothing credits a balance when one arrives.
// That is Phase 9. This file exists so the deposit screen is specific
// ("send to 0xAb12...") instead of generic, without the crediting half being
// built yet.
//
// The mnemonic lives in this browser's localStorage only, and only the ADDRESS
// (public, equivalent to what a block explorer would show anyone) is persisted
// to the database. Full custody, envelope encryption, a recovery key, export
// behind a PIN, is the real Phase 8 design and is not this.

import { generateMnemonic, mnemonicToAccount, english } from "viem/accounts";
import { supabase } from "./supabase";

const KEY_PREFIX = "biya_wallet_mnemonic_";

function loadMnemonic(userId: string): string | null {
  return localStorage.getItem(KEY_PREFIX + userId);
}

function saveMnemonic(userId: string, mnemonic: string): void {
  localStorage.setItem(KEY_PREFIX + userId, mnemonic);
}

async function fetchStoredAddress(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("user_wallets")
    .select("address")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.address ?? null;
}

/**
 * Returns this user's deposit address, creating one on first call.
 *
 * Checks the database first so a returning session on the same device (or a
 * fresh one, once the row exists) shows the same address rather than
 * generating a second one it cannot reconcile with the first.
 */
export async function getOrCreateAddress(userId: string): Promise<string> {
  const existing = await fetchStoredAddress(userId);
  if (existing) return existing;

  let mnemonic = loadMnemonic(userId);
  if (!mnemonic) {
    mnemonic = generateMnemonic(english);
    saveMnemonic(userId, mnemonic);
  }

  const account = mnemonicToAccount(mnemonic);

  const { data, error } = await supabase.rpc("ensure_user_wallet", {
    p_user: userId,
    p_address: account.address,
  });
  if (error || !data) throw new Error(error?.message ?? "Could not create a deposit address.");

  // Another device may have won the race and created the row first; the RPC
  // is idempotent and returns whichever address actually got stored.
  return data.address;
}
