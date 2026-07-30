import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ShieldCheck, Lock } from "lucide-react";
import { biya, font, formatNaira, toUsdt } from "../theme";
import { Wordmark } from "../primitives";
import type { Vendor } from "../data";

const LOCK_SECONDS = 90;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span style={{ fontFamily: font.display, fontSize: 15, color: biya.gray }}>{label}</span>
      {children}
    </div>
  );
}

export function ConfirmPayment({ vendor, amount, onConfirm, onCancel }: { vendor: Vendor; amount: number; onConfirm: () => void; onCancel: () => void }) {
  const [secs, setSecs] = useState(LOCK_SECONDS);

  useEffect(() => {
    if (secs <= 0) {
      onCancel();
      return;
    }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, onCancel]);

  const pct = (secs / LOCK_SECONDS) * 100;

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: biya.cream }}>
      <header className="flex items-center justify-between px-6 py-4">
        <button onClick={onCancel} className="flex items-center justify-center rounded-full" style={{ width: 40, height: 40, backgroundColor: biya.mute }}>
          <ChevronLeft size={20} color={biya.ink} />
        </button>
        <Wordmark size={22} />
        <div style={{ width: 40 }} />
      </header>

      <div className="flex-1 overflow-y-auto px-6">
        {/* Hero card */}
        <div className="relative overflow-hidden rounded-[36px] bg-white p-7" style={{ border: `1px solid ${biya.line}`, boxShadow: "0px 20px 60px rgba(0,0,0,0.05)" }}>
          {/* countdown bar */}
          <div className="absolute top-0 left-0 right-0" style={{ height: 4, backgroundColor: biya.mute }}>
            <div style={{ height: "100%", width: `${pct}%`, backgroundColor: secs <= 15 ? biya.red : biya.marigold, transition: "width 1s linear" }} />
          </div>

          <div className="flex flex-col items-center pt-2">
            <span style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: "1.4px", color: biya.gray }}>PAYMENT AMOUNT</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span style={{ fontFamily: font.serif, fontSize: 34, color: biya.ink }}>₦</span>
              <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 46, color: biya.ink, letterSpacing: "-0.03em" }}>{formatNaira(amount, true)}</span>
            </div>
          </div>

          <div className="mt-6 pt-5 flex flex-col gap-1" style={{ borderTop: `1px dashed ${biya.muteDeep}` }}>
            <Row label="Recipient"><span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: biya.ink }}>{vendor.name}</span></Row>
            <Row label="You pay (USDT)"><span style={{ fontFamily: font.mono, fontSize: 15, color: biya.greenText }}>≈ {toUsdt(amount)} USDT</span></Row>
            <Row label="Fee"><span style={{ fontFamily: font.mono, fontSize: 15, color: biya.ink }}>₦0.00</span></Row>
          </div>

          <div className="flex justify-center mt-5">
            <span className="flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: biya.muteAlt }}>
              <Lock size={13} color={secs <= 15 ? biya.red : biya.gold} />
              <span style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: secs <= 15 ? biya.red : biya.goldDeep }}>Rate locked for {secs}s</span>
            </span>
          </div>
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-4 rounded-[20px] p-5 mt-5" style={{ backgroundColor: biya.muteAlt, border: `1px solid ${biya.line}` }}>
          <ShieldCheck size={20} color={biya.marigold} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: biya.ink }}>Secure ABU Pay</p>
            <p style={{ fontFamily: font.display, fontSize: 12, color: biya.gray }}>Encrypted and protected by Cleva’s financial security layer.</p>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-6 pt-4 pb-8" style={{ backgroundColor: biya.cream }}>
        <button
          onClick={onConfirm}
          className="w-full flex items-center justify-center gap-2 rounded-full transition-transform active:scale-[0.98]"
          style={{ height: 56, backgroundColor: biya.marigold, fontFamily: font.display, fontWeight: 700, fontSize: 18, color: biya.goldDeep }}
        >
          <Lock size={16} /> Biya ₦{formatNaira(amount)}
        </button>
        <button onClick={onCancel} className="w-full text-center pt-4">
          <span style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: "0.6px", color: biya.gray }}>CANCEL PAYMENT</span>
        </button>
      </div>
    </div>
  );
}
