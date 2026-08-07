// The demo faucet. The one rail that is live today.
//
// It exists so every other feature can be exercised without a chain, a bank or
// a partner. It is labelled as a demo control everywhere it appears, because a
// funding button that mints dollars must never be mistaken for a real one.
//
// It is not a fake rail. It posts a real double-entry transaction through
// credit_test_funds, debiting the usdt_inbound system account and crediting the
// user, so it balances exactly like a deposit would. Money on this ledger is
// always conserved, including in the demo.

import { creditTestFunds } from "../api";
import { type FundingRail, type RailQuote, type RailStatus } from "./types";

const MAX_USD_MINOR = 20000; // $200 a go. A faucet, not a printing press.

export const testFundsRail: FundingRail = {
  id: "test_funds",
  name: "Test funds",
  blurb: "Demo only. Adds dollars so you can try the app.",
  kind: "in",
  icon: "Droplets",

  isConfigured: () => true,

  async quote(amountMinor: number): Promise<RailQuote | null> {
    const capped = Math.min(Math.max(amountMinor, 0), MAX_USD_MINOR);
    return {
      inMinor: capped,
      inCurrency: "USD",
      outUsdMinor: capped,
      feeUsdMinor: 0,
      eta: "Instant",
    };
  },

  async initiate(userId: string, amountMinor: number): Promise<RailStatus> {
    const capped = Math.min(Math.max(amountMinor, 0), MAX_USD_MINOR);
    if (capped <= 0) return { state: "failed", reason: "Enter an amount above zero." };
    try {
      await creditTestFunds(userId, capped);
      return { state: "credited", reference: `test:${Date.now()}`, usdMinor: capped };
    } catch (err) {
      return { state: "failed", reason: err instanceof Error ? err.message : "Could not add test funds." };
    }
  },

  // Instant and terminal, so there is nothing to poll.
  async status(reference: string): Promise<RailStatus> {
    return { state: "credited", reference, usdMinor: 0 };
  },
};
