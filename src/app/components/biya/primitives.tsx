import type { ReactNode } from "react";
import { biya, font } from "./theme";

export function Naira({ value, size = 36, decimals = true, color = biya.ink, signColor }: { value: string; size?: number; decimals?: boolean; color?: string; signColor?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2, color }}>
      <span style={{ fontFamily: font.serif, fontSize: size * 0.78, lineHeight: 1, color: signColor ?? color }}>₦</span>
      <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: size, lineHeight: 1, letterSpacing: "-0.03em" }}>{value}</span>
    </span>
  );
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: size, color: biya.gold }}>Biya</span>;
}

export function Label({ children, color = biya.gray, spacing = "0.6px" }: { children: ReactNode; color?: string; spacing?: string }) {
  return (
    <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 12, letterSpacing: spacing, color, textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

export function PrimaryButton({ children, onClick, disabled, height = 56, bg = biya.marigold, color = biya.goldDeep }: { children: ReactNode; onClick?: () => void; disabled?: boolean; height?: number; bg?: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 rounded-full transition-transform active:scale-[0.98] disabled:opacity-50"
      style={{ backgroundColor: bg, height, fontFamily: font.display, fontWeight: 700, fontSize: 18, color }}
    >
      {children}
    </button>
  );
}

import { motion } from "motion/react";

// Centers a phone-sized frame on a dark backdrop for larger screens, full viewport on mobile.
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="size-full min-h-screen flex items-center justify-center overflow-hidden relative bg-[#050505]">
      {/* Premium glowing ambient background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-center justify-center w-full h-full sm:w-[420px] sm:h-[860px]"
        style={{ maxHeight: "100vh" }}
      >
        <div className="relative overflow-hidden bg-white w-full h-full sm:rounded-[44px] sm:shadow-2xl">
          <div className="size-full overflow-hidden relative">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
