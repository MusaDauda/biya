// A dedicated NGN receiving account for each user, shown on the Bank transfer
// rail. Deterministic from the user's own id, so it is stable across reloads
// without a table: the same input always derives the same account number, the
// same way ensure_user_wallet derives a stable address from a mnemonic.
//
// This does not claim to be issued by anyone. No bank brand, no BVN claim, no
// mock regulatory language, just an account number and a bank code, styled the
// way a Nigerian virtual account actually looks, under Biya's own name. That
// distinction matters: this stub must never be mistaken for a claimed
// partnership with a real institution. See the AskUserQuestion decision in
// this session for why a real bank's name is deliberately not used here.
//
// Nothing behind this credits automatically. There is no listener, the same
// honest limitation as the stablecoin rail before its watcher exists.

const BANK_NAME = "Biya Virtual Account";
const BANK_CODE = "090"; // shaped like a real NIP bank code, claims no institution

/** Simple deterministic hash. Not cryptographic, this only needs to be stable, not secret. */
function hashToDigits(input: string, length: number): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  // NUBAN-style Nigerian account numbers are 10 digits and don't start with 0.
  const seed = String(h).padStart(10, "7");
  const first = String((h % 9) + 1);
  return (first + seed.slice(-9)).slice(0, length);
}

export type VirtualAccount = {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
};

export function getVirtualAccount(userId: string, accountName: string): VirtualAccount {
  return {
    accountNumber: hashToDigits(userId, 10),
    accountName: accountName.toUpperCase(),
    bankName: BANK_NAME,
    bankCode: BANK_CODE,
  };
}
