import { motion } from "motion/react";
import { ArrowUpRight, QrCode, Share2 } from "lucide-react";
import { biya, font } from "../theme";

export function VendorEmptyState({
  onShareCode,
}: {
  onShareCode: () => void;
}) {
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
            backgroundColor: biya.greenSoft,
            opacity: 0.3,
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            inset: 16,
            backgroundColor: biya.greenSoft,
            opacity: 0.5,
          }}
        />
        <span
          className="flex items-center justify-center rounded-full"
          style={{
            width: 80,
            height: 80,
            backgroundColor: biya.greenSoft,
          }}
        >
          <ArrowUpRight size={36} color="#00210f" />
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
        Share your Biya account number with students to start receiving payments at your
        stall.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full flex flex-col gap-3 mt-8 max-w-[280px]"
      >
        <button
          onClick={onShareCode}
          className="flex items-center justify-center gap-2 rounded-full transition-transform active:scale-[0.98]"
          style={{
            height: 56,
            backgroundColor: biya.marigold,
          }}
        >
          <QrCode size={18} color={biya.goldDeep} />
          <span
            style={{
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: 16,
              color: biya.goldDeep,
            }}
          >
            View Account Number
          </span>
        </button>
        <button
          onClick={onShareCode}
          className="flex items-center justify-center gap-2 rounded-full transition-transform active:scale-[0.98]"
          style={{
            height: 56,
            backgroundColor: "#fff",
            border: `1.5px solid ${biya.line}`,
          }}
        >
          <Share2 size={18} color={biya.ink} />
          <span
            style={{
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: 16,
              color: biya.ink,
            }}
          >
            Share Account Number
          </span>
        </button>
      </motion.div>
    </div>
  );
}
