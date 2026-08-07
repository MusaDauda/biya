// The rail registry.
//
// AddMoney renders whatever is in this array. Adding a way to fund an account
// is appending one entry; removing one is deleting a line. No screen knows the
// name of any particular rail, which is the point.

import { type FundingRail } from "./types";
import { testFundsRail } from "./testFunds";
import { usdtRail } from "./usdt";
import { clevaRail } from "./cleva";
import { bankNgnInRail, bankPayoutRail } from "./bank";

export * from "./types";
export { testFundsRail } from "./testFunds";
export { usdtRail } from "./usdt";
export { clevaRail } from "./cleva";
export { bankNgnInRail, bankPayoutRail } from "./bank";

export const RAILS: FundingRail[] = [
  testFundsRail,
  usdtRail,
  bankNgnInRail,
  clevaRail,
  bankPayoutRail,
];

export const fundingRails = () => RAILS.filter((r) => r.kind === "in");
export const payoutRails = () => RAILS.filter((r) => r.kind === "out");

export const railById = (id: string) => RAILS.find((r) => r.id === id) ?? null;

/** Live rails first, so the one that works is the one under your thumb. */
export function sortedFundingRails(): FundingRail[] {
  return [...fundingRails()].sort(
    (a, b) => Number(b.isConfigured()) - Number(a.isConfigured()),
  );
}
