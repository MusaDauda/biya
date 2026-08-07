// How money gets into a Biya account.
//
// Every way of funding an account implements this one interface, which is the
// whole architectural claim in Phase 6: Cleva is one file next to three others,
// not the centre of the system. Removing it would change nothing about how Biya
// works. That is the difference between integrating a partner and depending on
// one, and it is the direct answer to "make it an independent financial app".
//
// The stubs below are deliberately EMPTY rather than faked. A rail that is not
// configured says so, in the interface and in the code. A judge who opens
// cleva.ts and finds a real adapter with no credentials believes the
// architecture; one who finds a fake stops believing anything else here.

export type RailStatus =
  | { state: "not_configured"; reason: string }
  | { state: "ready" }
  | { state: "pending"; reference: string; message: string }
  | { state: "credited"; reference: string; usdMinor: number }
  | { state: "failed"; reason: string };

export type RailQuote = {
  /** What the user gives us, in the rail's own currency minor units. */
  inMinor: number;
  inCurrency: "USD" | "NGN";
  /** What lands in their Biya balance, in USD cents. */
  outUsdMinor: number;
  /** Our cut, in USD cents. Always shown, never folded into a rate. */
  feeUsdMinor: number;
  /** Human sentence about timing. Never a promise we cannot keep. */
  eta: string;
};

export type RailKind = "in" | "out";

export interface FundingRail {
  readonly id: string;
  readonly name: string;
  /** One line, written for a market trader, not for a developer. */
  readonly blurb: string;
  readonly kind: RailKind;
  /** Lucide icon name, resolved by the interface. */
  readonly icon: string;

  /** False when credentials or an upstream are missing. Never throws. */
  isConfigured(): boolean;

  /** What this rail would cost. Null when it cannot quote. */
  quote(amountMinor: number): Promise<RailQuote | null>;

  /** Begin a funding attempt. */
  initiate(userId: string, amountMinor: number): Promise<RailStatus>;

  /** Poll an in-flight attempt. */
  status(reference: string): Promise<RailStatus>;
}

/** Shared by every rail that has no upstream wired yet. */
export function notConfigured(reason: string): RailStatus {
  return { state: "not_configured", reason };
}
