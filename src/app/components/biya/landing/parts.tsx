import React, { useEffect, useRef, useState } from "react";
import { brand, font } from "../theme";

/**
 * Shared pieces for the marketing landing page.
 *
 * The landing page is the only surface that renders outside the phone frame, so
 * it carries its own layout rules rather than the app's. Everything here comes
 * from the two Claude Design files (Biya Landing Mobile and Biya Landing) and
 * the Biya Brand System. Nothing from the retired Figma import survives.
 *
 * One breakpoint, 900px. Below it the mobile design is exact. Above it the
 * desktop design is exact. Between 430px and 900px the clamp() values carry the
 * mobile layout up fluidly, so a tablet gets a full width page rather than a
 * 430px column stranded in the middle of the screen.
 */

export const LP_BP = 900;

/**
 * Scoped to .lp so none of this can reach the app, which is drawn inside the
 * phone frame and has its own rules.
 *
 * The reveal is CSS transitions driven by IntersectionObserver, deliberately
 * not a motion library. An exit animation gated on requestAnimationFrame is
 * what wedged the app once already: rAF is throttled in a backgrounded tab and
 * on a locked phone, so anything that gates content on it can strand the page.
 * A one way opacity and transform transition cannot.
 */
export const LANDING_CSS = `
.lp{width:100%;overflow-x:hidden;background:${brand.paper};font-family:${font.sans};-webkit-text-size-adjust:100%}
.lp a{text-decoration:none;color:inherit}
.lp-wrap{max-width:1180px;margin:0 auto}

.lp-rise{transition:opacity .52s cubic-bezier(.2,.7,.2,1),transform .52s cubic-bezier(.2,.7,.2,1);opacity:0;transform:translateY(16px)}
.lp-rise[data-in="1"]{opacity:1;transform:none}
.lp-zoom{transition:transform 1.05s cubic-bezier(.2,.7,.2,1);transform:scale(1.06)}
.lp-zoom[data-in="1"]{transform:scale(1)}

.lp-two{display:grid;gap:clamp(32px,6vw,80px)}
.lp-duo{display:grid;gap:clamp(16px,3vw,32px)}
.lp-sched{display:grid;gap:clamp(32px,6vw,80px)}
.lp-scan-media{aspect-ratio:3/4}
.lp-cta-row{display:flex;flex-direction:column;gap:12px}
.lp-qr{display:none}
.lp-foot{display:flex;flex-direction:column;gap:18px;align-items:flex-start}

@media (min-width:${LP_BP}px){
  .lp-rise{transform:translateY(18px)}
  .lp-zoom{transform:scale(1.05)}
  .lp-two{grid-template-columns:1fr 1fr;align-items:center}
  /* Media sits left on a wide screen, but stays after the heading in the DOM so
     a phone reads heading first. Order swaps it rather than duplicating markup. */
  .lp-two-media-left>:first-child{order:2}
  .lp-two-media-left>:last-child{order:1}
  .lp-duo{grid-template-columns:1fr 1fr}
  /* The scheduled section's button sits under the card on a phone and beside
     the heading on a desktop, so it is its own grid item, not part of either. */
  .lp-sched{grid-template-columns:1fr 1fr;grid-template-areas:"media head" "media cta";column-gap:clamp(32px,6vw,80px);row-gap:26px;align-content:center}
  .lp-sched-media{grid-area:media;align-self:center}
  .lp-sched-head{grid-area:head;align-self:end}
  .lp-sched-cta{grid-area:cta;align-self:start}
  .lp-scan-media{aspect-ratio:4/3}
  .lp-cta-row{flex-direction:row;flex-wrap:wrap}
  .lp-app{grid-template-columns:minmax(0,1fr) auto}
  .lp-qr{display:block}
  .lp-foot{flex-direction:row;align-items:center;justify-content:space-between;gap:16px}
}

@media (prefers-reduced-motion:reduce){
  .lp-rise,.lp-zoom{transition:none;opacity:1;transform:none}
}
`;

// --- reveal -----------------------------------------------------------------

/**
 * Reveals once, on first intersection, then stops watching.
 *
 * Two safeguards, both from the design's own script. Anything already on screen
 * at mount reveals without waiting for a scroll that may never come, and a
 * failsafe timer reveals everything regardless. A marketing page that renders
 * its content permanently invisible because an observer never fired is worse
 * than one with no animation at all.
 */
function useReveal(delay: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    let stagger: number | undefined;
    const reveal = () => {
      stagger = window.setTimeout(() => setShown(true), delay);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal();
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);

    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) {
      reveal();
      io.disconnect();
    }

    const failsafe = window.setTimeout(() => {
      setShown(true);
      io.disconnect();
    }, 4000);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
      if (stagger) window.clearTimeout(stagger);
    };
  }, [delay]);

  return { ref, shown };
}

type RevealProps = {
  kind?: "rise" | "zoom";
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  children?: React.ReactNode;
};

export function Reveal({ kind = "rise", delay = 0, className, style, id, children }: RevealProps) {
  const { ref, shown } = useReveal(delay);
  return (
    <div
      ref={ref}
      id={id}
      data-in={shown ? "1" : "0"}
      className={[kind === "zoom" ? "lp-zoom" : "lp-rise", className].filter(Boolean).join(" ")}
      style={style}
    >
      {children}
    </div>
  );
}

// --- image slots ------------------------------------------------------------

/**
 * The design's photography slots.
 *
 * Every slot in the design is a placeholder describing a photograph that has
 * not been taken yet ("Samaru stall at dusk", "a market vendor behind her
 * counter"). Rather than fill them with stock imagery that would misrepresent
 * the product, an unfilled slot renders nothing and lets the night ground it
 * sits on show through. The sections are already built on that ground with a
 * gradient over it, so the page reads as a deliberate dark treatment until real
 * photographs arrive. Pass `src` to fill one.
 */
export function ImageSlot({
  src,
  alt = "",
  fit = "cover",
}: {
  src?: string;
  alt?: string;
  fit?: "cover" | "contain";
}) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit }}
    />
  );
}

// --- type ------------------------------------------------------------------
// Clamp floors are the mobile design's values and ceilings are the desktop
// design's, so each viewport gets its own design exactly and the middle
// interpolates rather than jumping.

export const eyebrow = (color: string): React.CSSProperties => ({
  fontFamily: font.mono,
  fontSize: "clamp(12px,1.1vw,14px)",
  fontWeight: 400,
  lineHeight: 1,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color,
});

export const hookTitle: React.CSSProperties = {
  fontFamily: font.sans,
  fontSize: "clamp(46px,5.6vw,66px)",
  fontWeight: 700,
  lineHeight: 1.06,
  letterSpacing: "-.042em",
  color: brand.white,
  textWrap: "pretty" as never,
};

/** Sections that carry the page's weight: the account, and getting the app. */
export const bigTitle = (color: string): React.CSSProperties => ({
  fontFamily: font.sans,
  fontSize: "clamp(38px,4.6vw,56px)",
  fontWeight: 700,
  lineHeight: 1.1,
  letterSpacing: "-.04em",
  color,
  textWrap: "pretty" as never,
});

/** Every other section heading. */
export const title = (color: string): React.CSSProperties => ({
  fontFamily: font.sans,
  fontSize: "clamp(36px,4.2vw,52px)",
  fontWeight: 700,
  lineHeight: 1.11,
  letterSpacing: "-.04em",
  color,
  textWrap: "pretty" as never,
});

export const lead = (color: string): React.CSSProperties => ({
  fontFamily: font.sans,
  fontSize: "clamp(18px,1.7vw,22px)",
  fontWeight: 400,
  lineHeight: 1.5,
  color,
});

export const sectionPad = "clamp(72px,10vw,124px) clamp(22px,4vw,44px)";

/** The dark rounded panel a screenshot sits on, used by five sections. */
export const darkPanel: React.CSSProperties = {
  position: "relative",
  borderRadius: 26,
  overflow: "hidden",
  background: brand.night,
  padding: "clamp(22px,4vw,44px) clamp(18px,3vw,32px)",
};

export const panelScrim: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(rgba(12,14,18,.34),rgba(12,14,18,.6))",
};

// --- mark -------------------------------------------------------------------

/** The seal, drawn at the geometry the brand system defines. */
export function LandingMark({ size = 28, tone }: { size?: number; tone: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 8h7a8 8 0 0 1 0 16 8 8 0 0 1 0 16h-7a7 7 0 0 1-7-7V15a7 7 0 0 1 7-7zm7 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7zm0 16a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7z"
        fill={tone}
      />
      <circle cx="37.5" cy="24" r="6" fill={tone} />
    </svg>
  );
}

export function LandingLockup({ size = 28, tone }: { size?: number; tone: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.36 }}>
      <LandingMark size={size} tone={tone} />
      <span
        style={{
          fontFamily: font.sans,
          fontWeight: 700,
          fontSize: size * 0.72,
          lineHeight: 1,
          letterSpacing: "-.03em",
          color: tone,
        }}
      >
        Biya
      </span>
    </div>
  );
}
