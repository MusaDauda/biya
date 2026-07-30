import { useEffect } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import confetti from "canvas-confetti";
import { biya, font, formatNaira } from "../theme";
import type { Vendor } from "../data";

export function PaymentSuccess({ vendor, amount, reference, onDone }: { vendor: Vendor; amount: number; reference: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.35 }, colors: [biya.marigold, biya.green, biya.gold, biya.ink] });
    }, 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="h-full flex flex-col justify-between" style={{ backgroundColor: biya.cream }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Tick with rings */}
        <div className="relative flex items-center justify-center mb-8" style={{ width: 128, height: 128 }}>
          <motion.span className="absolute rounded-full" style={{ inset: 0, backgroundColor: "rgba(31,164,99,0.1)" }} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          <motion.span className="absolute rounded-full" style={{ inset: 16, backgroundColor: "rgba(31,164,99,0.2)" }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.2 }} />
          <motion.span
            className="flex items-center justify-center rounded-full"
            style={{ width: 80, height: 80, backgroundColor: biya.green, boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.15)" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
          >
            <Check size={40} color="#fff" strokeWidth={3} />
          </motion.span>
        </div>

        <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: biya.ink }}>Payment successful</p>
        <p className="mt-1 text-center" style={{ fontFamily: font.display, fontSize: 15, color: biya.gray }}>
          Payment to <span style={{ color: biya.ink, fontWeight: 600 }}>{vendor.name}</span> complete
        </p>

        {/* Amount card */}
        <div className="w-full mt-8 rounded-[32px] bg-white overflow-hidden" style={{ border: `1px solid ${biya.line}`, boxShadow: "0px 20px 40px rgba(0,0,0,0.05)" }}>
          <div style={{ borderLeft: `4px solid ${biya.green}` }} className="p-6">
            <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "1.4px", color: biya.gray }}>AMOUNT PAID</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span style={{ fontFamily: font.serif, fontSize: 26, color: biya.ink }}>₦</span>
              <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 34, color: biya.ink }}>{formatNaira(amount, true)}</span>
            </div>
            <div className="mt-5 pt-4 flex flex-col gap-3" style={{ borderTop: `1px solid ${biya.line}` }}>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: font.mono, fontSize: 12, color: biya.gray }}>Receipt</span>
                <span style={{ fontFamily: font.mono, fontSize: 13, color: biya.ink }}>Cleva Pay Confirmation</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: font.mono, fontSize: 12, color: biya.gray }}>Reference</span>
                <span style={{ fontFamily: font.mono, fontSize: 13, color: biya.ink }}>{reference}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-10">
        <button onClick={onDone} className="w-full flex items-center justify-center rounded-full transition-transform active:scale-[0.98]" style={{ height: 56, backgroundColor: biya.ink }}>
          <span style={{ fontFamily: font.mono, fontSize: 14, letterSpacing: "2px", color: "#fff" }}>DONE</span>
        </button>
      </div>
    </div>
  );
}
