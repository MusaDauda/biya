import { ScanLine, Bell, Keyboard, ChevronRight } from "lucide-react";
import { biya, font, formatNaira, toUsdt, relativeTime } from "../theme";
import { Naira, Label } from "../primitives";
import { vendorIcons, type Txn } from "../data";
import { StudentEmptyState } from "./StudentEmptyState";

export function StudentHome({ balance, txns, onScan, onManual, onViewAll, name }: { balance: number; txns: Txn[]; onScan: () => void; onManual: () => void; onViewAll: () => void; name?: string }) {
  return (
    <div className="h-full overflow-y-auto pb-32" style={{ backgroundColor: biya.cream }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center rounded-full" style={{ width: 40, height: 40, backgroundColor: biya.peach }}>
            <span style={{ fontFamily: font.display, fontWeight: 700, color: biya.gold }}>{(name && name.charAt(0).toUpperCase()) || "D"}</span>
          </span>
          <div>
            <Label spacing="1.2px">Good morning</Label>
            <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 24, color: biya.ink, lineHeight: 1.1 }}>{name || "Danladi"}</p>
          </div>
        </div>
        <button className="flex items-center justify-center rounded-full" style={{ width: 44, height: 44, backgroundColor: "#fff", border: `1px solid ${biya.line}` }}>
          <Bell size={18} color={biya.ink} />
        </button>
      </header>

      {/* Balance card */}
      <div className="px-6">
        <div className="relative overflow-hidden rounded-[36px] p-7" style={{ background: "linear-gradient(135deg, #000218 0%, #141b3c 100%)" }}>
          <div className="absolute rounded-full" style={{ width: 180, height: 180, top: -50, right: -50, background: "rgba(254,174,44,0.18)", filter: "blur(40px)" }} />
          <Label color="rgba(190,196,238,0.9)" spacing="1.2px">Available balance</Label>
          <div className="mt-3">
            <Naira value={formatNaira(balance, true)} size={44} color="#fff" signColor={biya.peach} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span style={{ fontFamily: font.mono, fontWeight: 500, fontSize: 14, color: biya.greenSoft }}>≈ {toUsdt(balance)} USDT</span>
            <span className="rounded-full" style={{ width: 4, height: 4, backgroundColor: biya.muteDeep }} />
            <span style={{ fontFamily: font.mono, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>estimate · locked at payment</span>
          </div>
        </div>
      </div>

      {/* Primary & Quick Actions */}
      <section className="px-6 pt-6 space-y-4">
        <button
          onClick={onScan}
          className="w-full h-[72px] rounded-2xl flex items-center justify-between px-6 active:scale-[0.98] transition-all"
          style={{ backgroundColor: biya.marigold, color: "#fff" }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <ScanLine size={22} color="#fff" />
            </div>
            <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 18 }}>Scan to Biya</span>
          </div>
          <ChevronRight size={24} color="#fff" />
        </button>

        <button
          onClick={onManual}
          className="w-full h-16 rounded-2xl border border-[#c4c6d4] bg-white flex items-center px-6 active:bg-surface transition-colors"
          style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}
        >
          <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center mr-4">
            <Keyboard size={18} color={biya.ink} />
          </div>
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: biya.ink }}>Enter account number</span>
        </button>
      </section>

      {/* Recent activity */}
      <div className="px-6 pt-8">
        {txns.length === 0 ? (
          <StudentEmptyState onScan={onScan} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: biya.ink }}>Recent activity</h2>
              <button onClick={onViewAll}><Label color={biya.gold}>View all</Label></button>
            </div>
            <div className="rounded-[28px] bg-white overflow-hidden" style={{ border: `1px solid ${biya.line}` }}>
              {txns.slice(0, 3).map((t, i) => {
                const Icon = vendorIcons[t.vendor] ?? vendorIcons["Iya Basira Food"];
                return (
                  <div key={t.id} className="flex items-center justify-between px-5 py-4" style={{ borderBottom: i < 2 ? `1px solid rgba(20,27,60,0.06)` : "none" }}>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center justify-center rounded-2xl" style={{ width: 44, height: 44, backgroundColor: biya.mute }}>
                        <Icon size={18} color={biya.ink} />
                      </span>
                      <div>
                        <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: biya.ink }}>{t.vendor}</p>
                        <p style={{ fontFamily: font.display, fontSize: 12, color: biya.gray }}>{relativeTime(t.ts)}</p>
                      </div>
                    </div>
                    <span style={{ fontFamily: font.mono, fontWeight: 500, fontSize: 15, color: biya.ink }}>- ₦{formatNaira(t.amount)}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
