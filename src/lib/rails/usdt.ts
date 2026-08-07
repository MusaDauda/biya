// Stablecoin deposits.
//
// SPLIT DELIBERATELY IN TWO, and only half of it is built:
//
//   1. Every user gets a real, unique EVM address (src/lib/wallet.ts). Built.
//   2. Something watches that address and credits a balance when a transfer
//      lands. Not built. That is services/watcher.ts, Phase 9.
//
// The UI presents this rail as live because the presenter handles that
// disclosure out loud rather than in the interface. Nothing here fabricates a
// credited balance: if money actually lands at this address today, nothing
// happens on its own, and the only way to reflect it in the app is the test
// funds rail. This file and its comments stay honest even though the screen
// built on top of it does not spell that out.
//
// WHAT MAKES THE CREDIT HALF CHEAP TO ADD, once built: the listener watches
// transfer logs for a configured token contract. USDT on Ethereum, USDT on
// Base, USDC, any ERC-20 is a row in a `chains` table. Nothing in the ledger
// changes, and nothing about the address changes either.
//
// On testnet, and today generally since nothing credits yet, this is not
// Tether's USDT. Never describe a deposit here as one in real conversation.

import { getOrCreateAddress } from "../wallet";
import { type FundingRail, type RailQuote, type RailStatus } from "./types";

export const usdtRail: FundingRail = {
  id: "usdt",
  name: "Stablecoin",
  blurb: "Get your own address for USDT and other stablecoins.",
  kind: "in",
  icon: "Coins",

  // The address half is real, so this rail is "configured" for the purpose of
  // showing up as usable.
  isConfigured: () => true,

  async quote(amountMinor: number): Promise<RailQuote | null> {
    // No spread on a deposit. A dollar in is a dollar credited; Biya earns on
    // the FX at the point of payment, which is already a visible ledger leg.
    return {
      inMinor: amountMinor,
      inCurrency: "USD",
      outUsdMinor: amountMinor,
      feeUsdMinor: 0,
      eta: "Usually within a few minutes",
    };
  },

  async initiate(userId: string): Promise<RailStatus> {
    try {
      const address = await getOrCreateAddress(userId);
      return {
        state: "pending",
        reference: address,
        // Internal note, not shown in the UI. See the file header: no listener
        // watches this address, so nothing credits on its own.
        message: "Address generated. No listener is watching it.",
      };
    } catch (err) {
      return { state: "failed", reason: err instanceof Error ? err.message : "Could not create an address." };
    }
  },

  async status(reference: string): Promise<RailStatus> {
    return { state: "pending", reference, message: "No listener is watching this address." };
  },
};
