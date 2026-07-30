import { motion } from "motion/react";
import { X, RotateCcw } from "lucide-react";
import { biya, font, formatNaira } from "../theme";
import type { Vendor } from "../data";

export function PaymentFailed({
  vendor,
  amount,
  reason = "Insufficient funds",
  onRetry,
  onHome,
}: {
  vendor: Vendor;
  amount: number;
  reason?: string;
  onRetry: () => void;
  onHome: () => void;
}) {
  return (
    <div
      className="h-full flex flex-col justify-between"
      style={{ backgroundColor: biya.cream }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Error icon with rings */}
        <div
          className="relative flex items-center justify-center mb-8"
          style={{ width: 128, height: 128 }}
        >
          <motion.span
            className="absolute rounded-full"
            style={{ inset: 0, backgroundColor: "rgba(186,26,26,0.08)" }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.span
            className="absolute rounded-full"
            style={{ inset: 16, backgroundColor: "rgba(186,26,26,0.15)" }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          />
          <motion.span
            className="flex items-center justify-center rounded-full"
            style={{
              width: 80,
              height: 80,
              backgroundColor: biya.red,
              boxShadow: "0px 20px 25px -5px rgba(186,26,26,0.25)",
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
          >
            <X size={40} color="#fff" strokeWidth={3} />
          </motion.span>
        </div>

        <p
          style={{
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: 22,
            color: biya.ink,
          }}
        >
          Payment Failed
        </p>

        {/* Reason callout */}
        <div
          className="mt-4 rounded-xl px-6 py-3 flex flex-col items-center gap-1"
          style={{
            backgroundColor: "rgba(255,218,214,0.3)",
            border: "1px solid rgba(186,26,26,0.1)",
          }}
        >
          <span
            style={{
              fontFamily: font.mono,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.6px",
              color: "#93000a",
              opacity: 0.8,
            }}
          >
            REASON
          </span>
          <span
            style={{
              fontFamily: font.mono,
              fontWeight: 500,
              fontSize: 16,
              color: "#93000a",
            }}
          >
            {reason}
          </span>
        </div>

        {/* Transaction summary card */}
        <div
          className="w-full mt-8 rounded-[32px] bg-white overflow-hidden"
          style={{
            border: `1px solid ${biya.line}`,
            boxShadow: "0px 20px 40px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{ borderLeft: `4px solid ${biya.red}` }}
            className="p-6"
          >
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 11,
                letterSpacing: "1.4px",
                color: biya.gray,
              }}
            >
              AMOUNT
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                style={{
                  fontFamily: font.serif,
                  fontSize: 26,
                  color: biya.ink,
                }}
              >
                ₦
              </span>
              <span
                style={{
                  fontFamily: font.mono,
                  fontWeight: 700,
                  fontSize: 34,
                  color: biya.ink,
                }}
              >
                {formatNaira(amount, true)}
              </span>
            </div>
            <div
              className="mt-5 pt-4 flex items-center justify-between"
              style={{ borderTop: `1px solid ${biya.line}` }}
            >
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 12,
                  color: biya.gray,
                }}
              >
                VENDOR
              </span>
              <span
                style={{
                  fontFamily: font.display,
                  fontWeight: 700,
                  fontSize: 14,
                  color: biya.ink,
                }}
              >
                {vendor.name}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 12,
                  color: biya.gray,
                }}
              >
                STATUS
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: biya.red,
                  }}
                />
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 13,
                    color: biya.red,
                  }}
                >
                  Failed
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-6 pb-10 flex flex-col gap-3">
        <button
          onClick={onRetry}
          className="w-full flex items-center justify-center gap-2 rounded-full transition-transform active:scale-[0.98]"
          style={{
            height: 56,
            backgroundColor: biya.marigold,
          }}
        >
          <RotateCcw size={18} color={biya.goldDeep} />
          <span
            style={{
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: 18,
              color: biya.goldDeep,
            }}
          >
            Try Again
          </span>
        </button>
        <button
          onClick={onHome}
          className="w-full flex items-center justify-center rounded-full transition-transform active:scale-[0.98]"
          style={{ height: 56, backgroundColor: biya.ink }}
        >
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 14,
              letterSpacing: "2px",
              color: "#fff",
            }}
          >
            BACK TO HOME
          </span>
        </button>
      </div>
    </div>
  );
}
