import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";
import { biya, font, formatNaira } from "../theme";
import type { SettlementRecord } from "../demoData";

export function VendorSettlements({ settlements }: { settlements: SettlementRecord[] }) {
  const [open, setOpen] = useState<string | null>("s0");

  return (
    <div className="h-full overflow-y-auto pb-32" style={{ backgroundColor: biya.cream }}>
      <header className="px-6 pt-8 pb-4">
        <h1 style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, color: biya.ink }}>Settlements</h1>
        <p style={{ fontFamily: font.display, fontSize: 14, color: biya.gray }}>Instant payouts</p>
      </header>

      <div className="px-6 flex flex-col gap-3">
        {settlements.map((s) => {
          const isOpen = open === s.id;
          const paid = s.status === "paid";
          return (
            <div key={s.id} className="rounded-[24px] bg-white overflow-hidden" style={{ border: `1px solid ${biya.line}` }}>
              <button onClick={() => setOpen(isOpen ? null : s.id)} className="w-full flex items-center justify-between px-5 py-5 text-left">
                <div className="flex items-center gap-4">
                  <span className="flex items-center justify-center rounded-2xl" style={{ width: 46, height: 46, backgroundColor: paid ? biya.greenSoft : biya.peach }}>
                    {paid ? <CheckCircle2 size={20} color={biya.greenText} /> : <Clock size={20} color={biya.gold} />}
                  </span>
                  <div>
                    <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: biya.ink }}>{s.date}</p>
                    <span className="flex items-center gap-1.5">
                      <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: paid ? biya.greenText : biya.gold }}>{paid ? "PAID" : "PENDING · 9PM"}</span>
                      <span style={{ fontFamily: font.display, fontSize: 12, color: biya.gray }}>· {s.count} payments</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 17, color: biya.ink }}>₦{formatNaira(s.total)}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown size={18} color={biya.gray} /></motion.span>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                    <div className="px-5 pb-5">
                      <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: biya.muteAlt }}>
                        <div className="flex items-center justify-between">
                          <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "0.6px", color: biya.gray }}>DESTINATION</span>
                          <span style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 600, color: biya.ink }}>{s.destination}</span>
                        </div>
                      </div>
                      {s.items.length > 0 ? (
                        <div className="flex flex-col">
                          <p className="mb-1" style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "0.6px", color: biya.gray }}>INSTANT PAYMENTS</p>
                          {s.items.map((it, i) => (
                            <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < s.items.length - 1 ? "1px solid rgba(20,27,60,0.06)" : "none" }}>
                              <span className="flex items-center gap-2.5">
                                <ArrowUpRight size={15} color={biya.green} />
                                <span style={{ fontFamily: font.display, fontSize: 14, color: biya.ink }}>{it.time}</span>
                              </span>
                              <span style={{ fontFamily: font.mono, fontSize: 14, color: biya.ink }}>₦{formatNaira(it.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontFamily: font.display, fontSize: 13, color: biya.gray }}>{s.count} payments settled instantly to {s.destination}.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
