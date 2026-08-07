import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { biya, brand, font, formatRate, type } from "./theme";
import { PrimaryButton, SecondaryButton, Wordmark } from "./primitives";
import { getCurrentFx, type FxSnapshot, type Me } from "../../../lib/api";

// A1, the welcome screen.
//
// Reached after the splash, once someone has chosen to enter the app from the
// marketing page. One screen, one decision. The rate is real and read from the
// same feed the pay screen quotes from, so the first number a person sees is
// not a marketing number.
export function Welcome({ onSignUp, onLogIn, user }: {
  onSignUp: () => void;
  onLogIn: () => void;
  user: Me | null;
}) {
  const [fx, setFx] = useState<FxSnapshot | null>(null);
  useEffect(() => { getCurrentFx().then(setFx).catch(() => {}); }, []);

  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ backgroundColor: biya.ground }}>
      <div style={{ padding: "0 24px", paddingTop: "calc(26px + var(--safe-top, 0px))" }}>
        <Wordmark size={28} variant="ink" />
      </div>

      <div className="flex-1 flex flex-col justify-center" style={{ padding: "32px 24px 0" }}>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: font.sans, fontWeight: 700, fontSize: 38, lineHeight: 1.08,
            letterSpacing: "-0.04em", color: biya.ink,
          }}
        >
          Hold dollars.
          <br />
          Pay in naira.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          style={{ ...type.body, fontSize: 15, color: biya.muted, marginTop: 16, maxWidth: 330 }}
        >
          Keep your money in a dollar account. Everyone you pay still receives naira, instantly,
          at a rate you see before you send.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="flex"
          style={{ gap: 28, marginTop: 34 }}
        >
          <Stat
            value={fx ? `₦${formatRate(fx.effectiveRate)}` : "..."}
            label="Rate now"
          />
          <Stat value="One tap" label="To pay anyone" />
        </motion.div>
      </div>

      <div style={{ padding: "24px", paddingBottom: "max(24px, var(--safe-bottom, 0px))" }}>
        <PrimaryButton onClick={onSignUp}>
          {user ? "Open my account" : "Create an account"}
        </PrimaryButton>
        <div style={{ height: 10 }} />
        <SecondaryButton onClick={onLogIn}>I already have one</SecondaryButton>

        <p style={{ ...type.bodySm, color: biya.faint, marginTop: 18, textAlign: "center" }}>
          One account. Pay anyone, get paid by anyone.
        </p>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: font.sans, fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", color: brand.ink }}>
        {value}
      </div>
      <div
        style={{
          fontFamily: font.mono, fontSize: 10, letterSpacing: "0.09em",
          textTransform: "uppercase", color: biya.faint, marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
}
