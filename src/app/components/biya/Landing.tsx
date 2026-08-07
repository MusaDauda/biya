import { motion } from "motion/react";
import { biya, brand, font, type } from "./theme";
import { PrimaryButton, SecondaryButton, Wordmark, WordmarkStacked } from "./primitives";

// PLACEHOLDER.
//
// The real marketing page is being designed in Claude Design and will replace
// this file wholesale. It exists so the entry flow is wired end to end:
//
//   landing  ->  splash  ->  welcome  ->  auth  ->  onboarding  ->  app
//
// Unlike every other screen, this one is NOT inside the phone frame. It is the
// public web page, so it is mobile first and then lays out properly on a
// desktop rather than sitting as a 400px column in the middle of a monitor.
//
// Nothing below is meant to survive. Keep it on the brand tokens so it does not
// look broken in the meantime, and keep the two calls to action, because the
// screens after this one branch on which was pressed.

const POINTS: [string, string][] = [
  ["Your balance holds its value", "Dollars in, dollars sitting there. The naira side happens at the moment you pay."],
  ["Everyone you pay gets naira", "They do not need Biya, a dollar account, or to know anything changed."],
  ["One account, both directions", "The same person pays and gets paid. There is no buyer app and no seller app."],
];

export function Landing({ onEnter }: { onEnter: (intent: "signup" | "login") => void }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ backgroundColor: biya.ground }}>
      <header
        className="flex items-center justify-between mx-auto w-full"
        style={{
          maxWidth: 1120,
          padding: "0 24px",
          paddingTop: "calc(20px + var(--safe-top, 0px))",
          paddingBottom: 20,
        }}
      >
        <Wordmark size={26} variant="ink" />
        <button
          onClick={() => onEnter("login")}
          style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 14, color: biya.action }}
        >
          Log in
        </button>
      </header>

      {/* Hero. Single column on a phone, two columns from md up. */}
      <section
        className="mx-auto w-full grid md:grid-cols-2 md:items-center"
        style={{ maxWidth: 1120, padding: "24px 24px 0", gap: 48 }}
      >
        <div className="min-w-0">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-[40px] md:text-[60px] lg:text-[68px]"
            style={{ fontFamily: font.sans, fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.04em", color: biya.ink }}
          >
            A dollar account
            <br />
            that spends naira.
          </motion.h1>

          <p
            className="text-[15px] md:text-[17px]"
            style={{ fontFamily: font.sans, fontWeight: 400, lineHeight: 1.55, color: biya.muted, marginTop: 18, maxWidth: 460 }}
          >
            Hold your money in dollars. Pay any Nigerian, in naira, at a rate you see before you send.
          </p>

          <div className="flex flex-col sm:flex-row" style={{ gap: 10, marginTop: 30, maxWidth: 420 }}>
            <div className="flex-1"><PrimaryButton onClick={() => onEnter("signup")}>Get started</PrimaryButton></div>
            <div className="flex-1"><SecondaryButton onClick={() => onEnter("login")}>I already have an account</SecondaryButton></div>
          </div>
        </div>

        {/* On desktop the hero gets a companion. On a phone it is dead weight,
            so it does not render at all rather than stacking below the fold. */}
        <div className="hidden md:flex justify-center">
          <div
            className="flex items-center justify-center"
            style={{
              width: 300, height: 420, borderRadius: 28,
              backgroundColor: brand.night,
            }}
          >
            <WordmarkStacked size={72} variant="indigo" onDark />
          </div>
        </div>
      </section>

      <section
        className="mx-auto w-full grid md:grid-cols-3"
        style={{ maxWidth: 1120, padding: "56px 24px 0", gap: 28 }}
      >
        {POINTS.map(([title, blurb]) => (
          <div key={title} className="min-w-0">
            <div style={{ ...type.row, fontSize: 16, color: biya.ink }}>{title}</div>
            <p style={{ ...type.body, color: biya.faint, marginTop: 6 }}>{blurb}</p>
          </div>
        ))}
      </section>

      <footer
        className="mx-auto w-full"
        style={{
          maxWidth: 1120,
          margin: "56px auto 0",
          padding: "20px 24px",
          paddingBottom: "max(28px, var(--safe-bottom, 0px))",
          borderTop: `1px solid ${biya.line}`,
        }}
      >
        <span style={{ fontFamily: font.mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: biya.faint }}>
          Biya, {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}

/**
 * The splash.
 *
 * Straight from the brand system's SPLASH treatment: the night ground, the full
 * colour icon at 64, a 16px gap, and the wordmark at 22/700 tracked -0.04em in
 * white. It uses WordmarkStacked rather than its own copy of the artwork so the
 * mark cannot drift away from the spec here.
 *
 * Opacity only on entry. The mark is never scaled or transformed.
 */
export function Splash() {
  return (
    <div className="h-full flex items-center justify-center" style={{ backgroundColor: brand.night }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut" }}>
        <WordmarkStacked size={64} variant="indigo" onDark />
      </motion.div>
    </div>
  );
}
