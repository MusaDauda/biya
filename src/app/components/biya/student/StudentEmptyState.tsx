import { motion } from "motion/react";
import { ScanLine, QrCode, ArrowRight } from "lucide-react";
import { biya, font } from "../theme";

export function StudentEmptyState({ onScan }: { onScan: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
      {/* Illustrated icon */}
      <motion.div
        className="relative flex items-center justify-center mb-8"
        style={{ width: 140, height: 140 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <span
          className="absolute rounded-full"
          style={{
            inset: 0,
            backgroundColor: biya.peach,
            opacity: 0.5,
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            inset: 16,
            backgroundColor: biya.peach,
            opacity: 0.8,
          }}
        />
        <span
          className="flex items-center justify-center rounded-full"
          style={{
            width: 80,
            height: 80,
            backgroundColor: biya.marigold,
          }}
        >
          <QrCode size={36} color={biya.goldDeep} />
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          fontFamily: font.display,
          fontWeight: 700,
          fontSize: 22,
          color: biya.ink,
        }}
      >
        No payments yet
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-2 max-w-[260px]"
        style={{
          fontFamily: font.display,
          fontSize: 15,
          lineHeight: 1.5,
          color: biya.gray,
        }}
      >
        Scan a vendor's Biya account number to make your first payment on campus.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        onClick={onScan}
        className="mt-8 flex items-center justify-center gap-3 rounded-full transition-transform active:scale-[0.98]"
        style={{
          height: 60,
          width: "100%",
          maxWidth: 280,
          backgroundColor: biya.marigold,
          boxShadow: "0px 12px 24px -6px rgba(254,174,44,0.5)",
        }}
      >
        <span
          className="flex items-center justify-center rounded-full"
          style={{
            width: 36,
            height: 36,
            backgroundColor: biya.ink,
          }}
        >
          <ScanLine size={18} color="#fff" />
        </span>
        <span
          style={{
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: 18,
            color: biya.goldDeep,
          }}
        >
          Scan to Biya
        </span>
        <ArrowRight size={18} color={biya.goldDeep} />
      </motion.button>
    </div>
  );
}
