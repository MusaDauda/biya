import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { biya, brand, font } from "./theme";
import { WordmarkStacked } from "./primitives";
import { LANDING_CSS, LandingLockup } from "./landing/parts";
import {
  Account,
  Assistant,
  Business,
  GetTheApp,
  Hook,
  Rate,
  ScanAndPay,
  Scheduled,
  TransferAndRequest,
  type Enter,
} from "./landing/sections";

/**
 * The marketing landing page, built from the Claude Design files
 * "Biya Landing Mobile" (source of truth below 900px) and "Biya Landing"
 * (source of truth above it). Nine sections in the designed order.
 *
 * This is the only surface rendered outside the phone frame, so it is a real
 * web page: full width, mobile first, and laid out properly on a desktop
 * rather than a 430px column stranded in the middle of a monitor.
 *
 * The design's calls to action all point at an "#get-the-app" anchor because a
 * static mockup has nowhere else to send them. Here they enter the product:
 * onEnter("signup") or onEnter("login"), which is what App.tsx is waiting for.
 */

/**
 * The header rides on the hero, where white on a dark photograph is legible.
 * Past the hero it would be white on a near white ground, so it takes the light
 * treatment instead. The design specifies a dark scrim that never changes,
 * which works over the hero and leaves a dark smudge over everything below it.
 */
function Header({ onEnter }: { onEnter: Enter }) {
  const [onHero, setOnHero] = useState(true);

  useEffect(() => {
    const read = () => {
      const hero = document.getElementById("lp-hero");
      const past = hero ? hero.getBoundingClientRect().bottom <= 72 : window.scrollY > 320;
      setOnHero(!past);
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, []);

  const tone = onHero ? brand.white : biya.ink;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "16px clamp(20px,4vw,44px)",
        paddingTop: "calc(16px + var(--safe-top, 0px))",
        background: onHero
          ? "linear-gradient(rgba(12,14,18,.64),rgba(12,14,18,0))"
          : biya.ground,
        borderBottom: onHero ? "1px solid transparent" : `1px solid ${biya.line}`,
        // Deliberately not transitioned. A gradient does not interpolate to a
        // solid colour, so the transition bought nothing, and a transition that
        // stalls (a backgrounded tab produces no frames) leaves the bar
        // transparent with the page scrolling under it. The swap lands exactly
        // on the hero's edge, where it reads as intentional rather than abrupt.
      }}
    >
      <LandingLockup size={26} tone={tone} />
      <button
        onClick={() => onEnter("signup")}
        style={{
          display: "flex",
          alignItems: "center",
          minHeight: 44,
          padding: "0 17px",
          borderRadius: 12,
          background: onHero ? "rgba(255,255,255,.18)" : biya.action,
          fontFamily: font.sans,
          fontWeight: 600,
          fontSize: 14,
          lineHeight: 1,
          color: brand.white,
          whiteSpace: "nowrap",
          flex: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        Get the app
      </button>
    </div>
  );
}

export function Landing({ onEnter }: { onEnter: Enter }) {
  return (
    <div className="lp">
      <style>{LANDING_CSS}</style>
      <Header onEnter={onEnter} />
      <div id="lp-hero">
        <Hook onEnter={onEnter} />
      </div>
      <Account />
      <ScanAndPay />
      <TransferAndRequest />
      <Assistant />
      <Scheduled onEnter={onEnter} />
      <Business />
      <Rate />
      <GetTheApp onEnter={onEnter} />
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
    <div
      className="h-full flex items-center justify-center"
      style={{ backgroundColor: brand.night }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <WordmarkStacked size={64} variant="indigo" onDark />
      </motion.div>
    </div>
  );
}
