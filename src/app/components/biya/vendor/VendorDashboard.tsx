import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Wallet } from "lucide-react";
import { biya, font, formatNaira, relativeTime } from "../theme";
import { VendorEmptyState } from "./VendorEmptyState";
import type { VendorTxnRow } from "../data";

function useCountUp(value: number, duration = 800) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

export function VendorDashboard({
  vendorName,
  feed,
  onNavigateToCode,
  payoutLabel,
  payoutType,
}: {
  vendorName: string;
  feed: VendorTxnRow[];
  onNavigateToCode?: () => void;
  payoutLabel: string;
  payoutType: "cleva" | "bank";
}) {
  const paymentFeed = feed.map((t) => ({ id: t.id, amount: t.amount, ts: t.created_at, senderName: t.senderName }));

  const total = paymentFeed.reduce((s, t) => s + t.amount, 0);
  const animatedTotal = useCountUp(total);
  const avg = paymentFeed.length ? Math.round(total / paymentFeed.length) : 0;

  return (
    <div className="h-full overflow-y-auto pb-32" style={{ backgroundColor: biya.cream }}>
      <header className="px-6 pt-8 pb-2 flex items-center justify-between">
        <div>
          <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: biya.ink }}>{vendorName}</p>
          <span className="flex items-center gap-1.5">
            <motion.span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: biya.green }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
            <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 600, letterSpacing: "1px", color: biya.green }}>LIVE</span>
          </span>
        </div>
      </header>

      {/* Today's total */}
      <div className="px-6 pt-4">
        <span style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: "1.2px", color: biya.gray }}>TODAY'S TAKINGS</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span style={{ fontFamily: font.serif, fontSize: 40, color: biya.ink }}>₦</span>
          <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 52, color: biya.ink, letterSpacing: "-0.03em" }}>{formatNaira(animatedTotal)}</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-6 pt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[24px] bg-white p-5" style={{ border: `1px solid ${biya.line}` }}>
          <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "0.6px", color: biya.gray }}>TRANSACTIONS</span>
          <p style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 28, color: biya.ink }}>{paymentFeed.length}</p>
        </div>
        <div className="rounded-[24px] bg-white p-5" style={{ border: `1px solid ${biya.line}` }}>
          <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "0.6px", color: biya.gray }}>AVG. SALE</span>
          <p style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 28, color: biya.ink }}>₦{formatNaira(avg)}</p>
        </div>
      </div>

      {/* Settlement status */}
      <div className="px-6 pt-4">
        <div className="rounded-[24px] p-5 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #000218 0%, #141b3c 100%)" }}>
          <span className="flex items-center justify-center rounded-2xl" style={{ width: 48, height: 48, backgroundColor: "rgba(254,174,44,0.15)" }}>
            <Wallet size={22} color={biya.marigold} />
          </span>
          <div>
            <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "0.6px", color: "rgba(190,196,238,0.9)" }}>SETTLEMENT</span>
            <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: "#fff" }}>Instant, on every payment</p>
            <p style={{ fontFamily: font.display, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              Paid directly to {payoutType === "bank" ? "your bank account" : "your Cleva account"}
            </p>
          </div>
        </div>
      </div>

      {/* Live feed */}
      <div className="px-6 pt-6">
        <h2 className="mb-3" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: biya.ink }}>Live feed</h2>
        {paymentFeed.length === 0 ? (
          <VendorEmptyState onShareCode={() => onNavigateToCode?.()} />
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {paymentFeed.map((t, i) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -20, backgroundColor: "rgba(254,174,44,0.25)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(255,255,255,1)" }}
                transition={{ backgroundColor: { duration: 1.2 }, layout: { type: "spring", damping: 26, stiffness: 320 } }}
                className="flex items-center justify-between rounded-[20px] px-5 py-4"
                style={{ border: `1px solid ${biya.line}` }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center rounded-full" style={{ width: 40, height: 40, backgroundColor: biya.greenSoft }}>
                    <ArrowUpRight size={18} color="#00210f" />
                  </span>
                  <div>
                    <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: biya.ink }}>{t.senderName ? `Payment from ${t.senderName}` : "Payment received"}</p>
                    <p style={{ fontFamily: font.display, fontSize: 12, color: biya.gray }}>{i === 0 ? "just now" : relativeTime(t.ts)}</p>
                  </div>
                </div>
                <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 16, color: biya.green }}>+ ₦{formatNaira(t.amount)}</span>
              </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
