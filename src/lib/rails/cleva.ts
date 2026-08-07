// Cleva as a funding rail. NOT BUILT, and not built on purpose.
//
// STATE OF THE RELATIONSHIP: there is none. Biya has no partnership,
// integration, agreement or contact with Cleva beyond both being entrants in
// the same hackathon. Cleva publishes no developer API that we are aware of.
// Nothing in this file should be read, quoted or demoed as if it did.
//
// This file exists to make a structural point rather than a commercial one.
// Cleva implements the same FundingRail interface as the other three. It is one
// way money could get in, sitting beside a chain, a bank transfer and a faucet.
// If it never exists, Biya works. That is what "integrate Cleva but not at its
// core" looks like in code rather than in a slide.
//
// WHAT WOULD BE NEEDED to make this real, if such an API existed:
//
//   - A merchant or platform credential (client id and secret) issued to Biya.
//   - POST  /v1/collections    create a collection intent for a USD amount,
//                              returning a reference and a payment instruction.
//   - GET   /v1/collections/:ref   poll settlement state.
//   - A webhook signed with a shared secret, so we credit on their event rather
//     than on a poll. On receipt we would call post_transaction with the
//     reference as external_ref, and the unique index on
//     (kind, external_ref) would make redelivery a no-op. Idempotency is
//     already solved at the database; a new rail inherits it.
//
// None of those endpoints are published. The paths above are what the shape
// WOULD be, written from how collections APIs generally work, not copied from
// documentation that exists.

import { type FundingRail, type RailQuote, type RailStatus, notConfigured } from "./types";

const REASON = "No integration exists. Biya has no relationship with Cleva.";

export const clevaRail: FundingRail = {
  id: "cleva",
  name: "Cleva",
  blurb: "Fund from a Cleva balance.",
  kind: "in",
  icon: "Building2",

  // Hard false. There is no credential that would flip this today.
  isConfigured: () => false,

  async quote(): Promise<RailQuote | null> {
    return null;
  },

  async initiate(): Promise<RailStatus> {
    return notConfigured(REASON);
  },

  async status(): Promise<RailStatus> {
    return notConfigured(REASON);
  },
};
