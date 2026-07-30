import { CheckCircle2, Clock } from "lucide-react";
import { biya, font, formatNaira, DAY } from "../theme";
import { vendorIcons, type Txn } from "../data";

function groupLabel(ts: number): string {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const diff = startOfToday.getTime() - ts;
  if (ts >= startOfToday.getTime()) return "Today";
  if (diff < DAY) return "Yesterday";
  return "Earlier";
}

export function TransactionHistory({ txns }: { txns: Txn[] }) {
  const groups: Record<string, Txn[]> = {};
  for (const t of txns) {
    const g = groupLabel(t.ts);
    (groups[g] ??= []).push(t);
  }
  const order = ["Today", "Yesterday", "Earlier"].filter((g) => groups[g]);

  const timeStr = (ts: number) => new Date(ts).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="h-full overflow-y-auto pb-32" style={{ backgroundColor: biya.cream }}>
      <header className="px-6 pt-8 pb-4">
        <h1 style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, color: biya.ink }}>History</h1>
        <p style={{ fontFamily: font.display, fontSize: 14, color: biya.gray }}>All your payments</p>
      </header>

      <div className="px-6 flex flex-col gap-6">
        {order.map((g) => (
          <div key={g}>
            <p className="mb-2" style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: biya.gray, textTransform: "uppercase" }}>{g}</p>
            <div className="rounded-[28px] bg-white overflow-hidden" style={{ border: `1px solid ${biya.line}` }}>
              {groups[g].map((t, i) => {
                const Icon = vendorIcons[t.vendor] ?? vendorIcons["Iya Basira Food"];
                return (
                  <div key={t.id} className="flex items-center justify-between px-5 py-4" style={{ borderBottom: i < groups[g].length - 1 ? "1px solid rgba(20,27,60,0.06)" : "none" }}>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center justify-center rounded-2xl" style={{ width: 44, height: 44, backgroundColor: biya.mute }}>
                        <Icon size={18} color={biya.ink} />
                      </span>
                      <div>
                        <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: biya.ink }}>{t.vendor}</p>
                        <span className="flex items-center gap-1.5">
                          {t.status === "completed" ? <CheckCircle2 size={11} color={biya.green} /> : <Clock size={11} color={biya.gold} />}
                          <span style={{ fontFamily: font.display, fontSize: 12, color: biya.gray }}>
                            {t.status === "completed" ? "Completed" : "Settling"} · {timeStr(t.ts)}
                          </span>
                        </span>
                      </div>
                    </div>
                    <span style={{ fontFamily: font.mono, fontWeight: 500, fontSize: 15, color: biya.ink }}>- ₦{formatNaira(t.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
