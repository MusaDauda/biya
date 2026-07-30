import { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { Lock, Delete, Fingerprint } from "lucide-react";
import { biya, font } from "../theme";
import { hashPin } from "../../../../lib/hash";

export function PinEntry({
  pinHash,
  onConfirm,
  onCancel,
}: {
  pinHash: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutEndsAt, setLockoutEndsAt] = useState<number>(0);
  const [lockoutSecs, setLockoutSecs] = useState(0);

  useEffect(() => {
    if (lockoutEndsAt > 0) {
      const iv = setInterval(() => {
        const remaining = Math.ceil((lockoutEndsAt - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockoutEndsAt(0);
          setFailedAttempts(0);
          setLockoutSecs(0);
        } else {
          setLockoutSecs(remaining);
        }
      }, 500);
      return () => clearInterval(iv);
    }
  }, [lockoutEndsAt]);

  useEffect(() => {
    async function verify() {
      setVerifying(true);
      await new Promise((r) => setTimeout(r, 250)); // tiny delay for UX

      const enteredHash = await hashPin(pin);
      // For existing demo students without a PIN hash, allow fallback
      if (!pinHash || enteredHash === pinHash) {
        onConfirm();
      } else {
        const fails = failedAttempts + 1;
        setFailedAttempts(fails);
        setShake(true);
        setPin("");
        setVerifying(false);
        if (fails >= 3) {
          setLockoutEndsAt(Date.now() + 30000); // 30s lockout
        }
      }
    }

    if (pin.length === 4 && !verifying) {
      verify();
    }
  }, [pin, verifying, pinHash, onConfirm, failedAttempts]);

  const press = useCallback(
    (key: string) => {
      if (verifying || lockoutEndsAt > 0) return;
      if (key === "del") {
        setPin((p) => p.slice(0, -1));
        return;
      }
      setPin((prev) => (prev.length < 4 ? prev + key : prev));
    },
    [verifying, lockoutEndsAt],
  );

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: biya.cream }}
    >
      {/* Header */}
      <header className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 32,
              height: 32,
              backgroundColor: biya.goldDeep,
            }}
          >
            <Lock size={16} color="#fff" />
          </span>
          <span
            style={{
              fontFamily: font.mono,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.6px",
              color: biya.goldDeep,
            }}
          >
            Secure confirmation
          </span>
        </div>
        <h1
          style={{
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: 28,
            color: biya.ink,
            letterSpacing: "-0.7px",
          }}
        >
          Enter your PIN to confirm
        </h1>
      </header>

      {/* PIN Dots */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          className="flex items-center gap-6"
          animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          onAnimationComplete={() => setShake(false)}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="rounded-full"
              style={{
                width: 24,
                height: 24,
                border: pin.length > i ? "none" : `2px solid #c7c5cf`,
                backgroundColor:
                  pin.length > i ? biya.ink : "transparent",
              }}
              animate={
                pin.length === i + 1
                  ? { scale: [1, 1.3, 1] }
                  : {}
              }
              transition={{ duration: 0.2 }}
            />
          ))}
        </motion.div>

        {/* Forgot PIN / Lockout message */}
        <div className="mt-8 h-6 flex items-center justify-center">
          {lockoutEndsAt > 0 ? (
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 12,
                fontWeight: 600,
                color: biya.red,
              }}
            >
              Too many attempts. Try again in {lockoutSecs}s.
            </span>
          ) : (
            <button>
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  color: biya.gold,
                }}
              >
                Forgot PIN?
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Keypad */}
      <div className="px-4 pb-2">
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              className="flex items-center justify-center rounded-2xl transition-colors active:bg-[#e4e2df]"
              style={{
                height: 58,
                backgroundColor: "#fff",
                border: `1px solid ${biya.line}`,
              }}
            >
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 22,
                  color: biya.ink,
                }}
              >
                {k}
              </span>
            </button>
          ))}
          {/* Bottom row: biometric, 0, delete */}
          <button
            onClick={() => {
              if (lockoutEndsAt > 0) return;
              alert("Biometric authentication not set up on this device.");
            }}
            className="flex items-center justify-center rounded-2xl transition-colors active:bg-[#e4e2df]"
            style={{
              height: 58,
              backgroundColor: biya.muteAlt,
              border: `1px solid ${biya.line}`,
              opacity: lockoutEndsAt > 0 ? 0.5 : 1,
            }}
          >
            <Fingerprint size={24} color={biya.gold} />
          </button>
          <button
            onClick={() => press("0")}
            className="flex items-center justify-center rounded-2xl transition-colors active:bg-[#e4e2df]"
            style={{
              height: 58,
              backgroundColor: "#fff",
              border: `1px solid ${biya.line}`,
            }}
          >
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 22,
                color: biya.ink,
              }}
            >
              0
            </span>
          </button>
          <button
            onClick={() => press("del")}
            className="flex items-center justify-center rounded-2xl transition-colors active:bg-[#e4e2df]"
            style={{
              height: 58,
              backgroundColor: "#fff",
              border: `1px solid ${biya.line}`,
            }}
          >
            <Delete size={20} color={biya.ink} />
          </button>
        </div>
      </div>

      {/* Cancel */}
      <div className="px-6 pb-8 pt-2">
        <button onClick={onCancel} className="w-full text-center py-3">
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 12,
              letterSpacing: "0.6px",
              color: biya.gray,
            }}
          >
            CANCEL
          </span>
        </button>
      </div>
    </div>
  );
}
