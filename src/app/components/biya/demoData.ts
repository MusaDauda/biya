export type VendorDetails = {
  campus: string;
  code: string;
  payoutType: "cleva" | "bank";
  payoutLabel: string;
};

export function randomVendorCode(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function normalizeVendorCode(code?: string, fallback = true): string {
  const digits = (code ?? "").trim().replace(/\D/g, "");
  if (digits.length === 10) return digits;
  return fallback ? randomVendorCode() : "";
}

export function buildVendorDetails(input?: Partial<VendorDetails>): VendorDetails {
  const payoutType = input?.payoutType || "cleva";
  return {
    campus: input?.campus?.trim() || "ABU Samaru Campus",
    code: normalizeVendorCode(input?.code),
    payoutType,
    payoutLabel: input?.payoutLabel?.trim() || (payoutType === "bank" ? "Bank account" : "Cleva account"),
  };
}

export function isVendorFullyOnboarded(details: unknown): details is VendorDetails {
  if (!details || typeof details !== "object") return false;
  const value = details as Partial<VendorDetails>;
  return Boolean(value.campus && value.code && value.code.trim().length === 10 && value.payoutType && value.payoutLabel);
}

export type SettlementItem = { time: string; amount: number };
export type SettlementRecord = {
  id: string;
  date: string;
  count: number;
  total: number;
  status: "paid" | "pending";
  destination: string;
  items: SettlementItem[];
};

function formatDay(ts: number): string {
  return new Date(ts).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function buildSettlements(transactions: Array<{ id: string; amount: number; created_at: number }>, payoutLabel: string): SettlementRecord[] {
  const grouped: Record<string, SettlementRecord> = {};
  const today = dayKey(Date.now());

  for (const txn of transactions) {
    const key = dayKey(txn.created_at);
    if (!grouped[key]) {
      grouped[key] = {
        id: key,
        date: formatDay(txn.created_at),
        count: 0,
        total: 0,
        status: "paid", // Instantaneous payouts instead of pending batches
        destination: payoutLabel || "Cleva account",
        items: [],
      };
    }
    grouped[key].count += 1;
    grouped[key].total += txn.amount;
    grouped[key].items.push({
      time: formatTime(txn.created_at),
      amount: txn.amount,
    });
  }

  return Object.values(grouped).sort((a, b) => b.id.localeCompare(a.id));
}
