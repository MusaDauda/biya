// Naira in, naira out, over the Nigerian bank rails.
//
// bankNgnIn shows each user a dedicated virtual account (src/lib/virtualAccount.ts):
// a real-looking account number, deterministically derived from their own id,
// under their own name. It is a demo control, not a claimed integration with
// any bank. See the branding decision recorded in this session before
// changing that. Nothing behind it credits automatically; there is no
// collections partner and no webhook. bankPayout remains a plain stub.
//
// A NOTE ON THE RAIL ITSELF, worth being accurate about: NIBSS instant payments
// are among the best real-time settlement rails anywhere, and this is not a
// file about fixing them. Naira moves fine. What Biya changes is what the money
// is DENOMINATED in between the moment you earn it and the moment you spend it.
// The rail is not the problem; the currency is.
//
// WHAT A REAL bankNgnIn WOULD NEED, if built:
//   - A licensed collections partner. Biya holds no CBN licence and cannot
//     collect naira in its own name. This is a licensing gap, not a code gap,
//     and no amount of adapter cleverness closes it.
//   - The virtual account below, issued by that partner rather than derived
//     locally, so an inbound transfer is attributable without a narration the
//     sender has to type correctly.
//   - A webhook on credit. Credit the user in NGN, then let them convert.
//
// WHAT bankPayout WOULD NEED:
//   - The same partner, plus a payout balance funded in naira.
//   - Name enquiry before transfer, so a typo in an account number is caught
//     before money leaves rather than after.
//   - THE HARD PART, and the one we would rather name than hide: paying naira
//     out means holding naira liquidity, and today Biya's dollars sit at user
//     addresses because we do not sweep. Where that naira comes from is the
//     biggest unsolved question in the model. It is a treasury problem, not an
//     engineering one.

import { supabase } from "../supabase";
import { nameOf } from "../api";
import { getVirtualAccount } from "../virtualAccount";
import { type FundingRail, type RailQuote, type RailStatus, notConfigured } from "./types";

const REASON = "Needs a CBN-licensed partner. Not something we can build alone.";

export const bankNgnInRail: FundingRail = {
  id: "bank_ngn_in",
  name: "Bank transfer",
  blurb: "Send naira from your bank account.",
  kind: "in",
  icon: "Landmark",

  isConfigured: () => true,

  async quote(amountMinor: number): Promise<RailQuote | null> {
    return {
      inMinor: amountMinor,
      inCurrency: "NGN",
      outUsdMinor: 0,
      feeUsdMinor: 0,
      eta: "Usually a few minutes",
    };
  },

  async initiate(userId: string): Promise<RailStatus> {
    const { data } = await supabase
      .from("app_users")
      .select("display_name, business_name, email")
      .eq("id", userId)
      .maybeSingle();
    if (!data) return { state: "failed", reason: "Could not load your account." };

    const va = getVirtualAccount(userId, nameOf(data as any));
    return { state: "pending", reference: JSON.stringify(va), message: "Waiting for your transfer." };
  },

  async status(reference: string): Promise<RailStatus> {
    return { state: "pending", reference, message: "Waiting for your transfer." };
  },
};

export const bankPayoutRail: FundingRail = {
  id: "bank_payout",
  name: "Withdraw to bank",
  blurb: "Send naira to any Nigerian account.",
  kind: "out",
  icon: "Banknote",

  isConfigured: () => false,
  async quote(): Promise<RailQuote | null> { return null; },
  async initiate(): Promise<RailStatus> { return notConfigured(REASON); },
  async status(): Promise<RailStatus> { return notConfigured(REASON); },
};
