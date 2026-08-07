import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { biya, brand, font, mark, radius, type } from "./theme";

// ---------------------------------------------------------------------------
// Brand
//
// A stamped seal with one piece already leaving it. Two counters hold the seal
// open so it never reads as a coin. Below 24px the counters close and the mark
// becomes the monogram, which is why there are two glyph paths here and a size
// check that picks between them.
// ---------------------------------------------------------------------------

const SEAL_OPEN =
  "M13 8h7a8 8 0 0 1 0 16 8 8 0 0 1 0 16h-7a7 7 0 0 1-7-7V15a7 7 0 0 1 7-7zm7 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7zm0 16a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7z";
const SEAL_CLOSED = "M13 8h7a8 8 0 0 1 0 16 8 8 0 0 1 0 16h-7a7 7 0 0 1-7-7V15a7 7 0 0 1 7-7z";

/**
 * The approved mark variants, and only these. The brand system says do not
 * recolour, so the component takes a variant rather than two colour props:
 * an unapproved pairing is not expressible.
 *
 *   indigo   Biya Indigo tile, white glyph. The primary.
 *   ink      Ink tile, white glyph. Auth headers, receipts, code centres.
 *   knockout White tile, ink glyph. On the night ground.
 *   glyphInk Bare glyph in ink. Needs a quiet ground.
 *   glyphAir Bare glyph in white. Needs a quiet dark ground.
 */
export type MarkVariant = "indigo" | "ink" | "knockout" | "glyphInk" | "glyphAir";

const MARKS: Record<MarkVariant, { tile: string | null; glyph: string }> = {
  indigo: { tile: brand.indigo, glyph: brand.white },
  ink: { tile: brand.ink, glyph: brand.white },
  knockout: { tile: brand.white, glyph: brand.ink },
  glyphInk: { tile: null, glyph: brand.ink },
  glyphAir: { tile: null, glyph: brand.white },
};

/**
 * The Biya mark. Below 24px the counters close and it becomes the monogram,
 * automatically, because the brand system forbids shrinking the full icon
 * past that. Below 16px it does not render at all rather than render illegibly.
 */
export function BiyaIcon({ size = 28, variant = "indigo" }: { size?: number; variant?: MarkVariant }) {
  if (size < mark.minMonogram) return null;
  const closed = size < mark.minIcon;
  const { tile, glyph } = MARKS[variant];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      {tile && <rect width="48" height="48" rx="12" fill={tile} />}
      <g transform={tile ? "translate(4.8,4.8) scale(0.8)" : undefined}>
        <path fillRule="evenodd" clipRule="evenodd" d={closed ? SEAL_CLOSED : SEAL_OPEN} fill={glyph} />
        <circle cx="37.5" cy="24" r="6" fill={glyph} />
      </g>
    </svg>
  );
}

/**
 * Horizontal lockup. Proportions are the brand system's 168x48 artwork: the
 * wordmark is 32/48 of the icon, set 14/48 away from it, tracked -1.4 at 32px.
 *
 * The wordmark's colour follows the GROUND, not the tile. The brand system's
 * on-dark lockups pair the full colour indigo tile with a white wordmark, so a
 * tile variant alone cannot decide it.
 */
export function Wordmark({ size = 26, variant = "ink", onDark = false }: {
  size?: number; variant?: MarkVariant; onDark?: boolean;
}) {
  const text = onDark || variant === "knockout" || variant === "glyphAir" ? brand.white : brand.ink;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * mark.wordmarkGap }}>
      <BiyaIcon size={size} variant={variant} />
      <span
        style={{
          fontFamily: font.sans, fontWeight: 700, fontSize: size * mark.wordmarkScale,
          letterSpacing: mark.wordmarkTracking, color: text, lineHeight: 1,
        }}
      >
        Biya
      </span>
    </span>
  );
}

/**
 * Stacked lockup, used on the splash. Brand system draws the icon at 64 with
 * the wordmark at 22, tracked -.04em, on the night ground.
 */
export function WordmarkStacked({ size = 64, variant = "indigo", onDark = false }: {
  size?: number; variant?: MarkVariant; onDark?: boolean;
}) {
  const text = onDark || variant === "knockout" || variant === "glyphAir" ? brand.white : brand.ink;
  return (
    <span className="inline-flex flex-col items-center" style={{ gap: size * 0.25 }}>
      <BiyaIcon size={size} variant={variant} />
      <span
        style={{
          fontFamily: font.sans, fontWeight: 700, fontSize: size * (22 / 64),
          letterSpacing: "-0.04em", color: text, lineHeight: 1,
        }}
      >
        Biya
      </span>
    </span>
  );
}

/** "Verified on Biya", the storefront treatment from the brand system. */
export function VerifiedOnBiya() {
  return (
    <span className="inline-flex items-center" style={{ gap: 5 }}>
      <BiyaIcon size={16} variant="ink" />
      <span style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 10.5, color: biya.muted }}>
        Verified on Biya
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** Full height screen on the paper ground, with the top safe area applied. */
export function Screen({ children, bg = biya.ground, pad = true }: { children: ReactNode; bg?: string; pad?: boolean }) {
  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: bg, paddingTop: pad ? "var(--safe-top, 0px)" : 0 }}
    >
      {children}
    </div>
  );
}

/** Back chevron, optional title, optional trailing control. */
export function ScreenHeader({
  title, onBack, right, dark = false,
}: { title?: string; onBack?: () => void; right?: ReactNode; dark?: boolean }) {
  const tone = dark ? "#fff" : biya.ink;
  return (
    <div className="flex items-center gap-3 px-5" style={{ height: 52, flex: "none" }}>
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back"
          className="flex items-center justify-center rounded-full transition-opacity active:opacity-60"
          style={{ width: 36, height: 36, marginLeft: -8 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {title && <span style={{ ...type.title, fontSize: 17, color: tone }}>{title}</span>}
      <span className="flex-1" />
      {right}
    </div>
  );
}

/** White surface, hairline border, 16 radius. The default container. */
export function Card({ children, style, onClick }: { children: ReactNode; style?: CSSProperties; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={onClick ? "transition-transform active:scale-[0.995]" : undefined}
      style={{
        backgroundColor: biya.surface,
        border: `1px solid ${biya.line}`,
        borderRadius: radius.card,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Uppercase mono label. Sits above every value block. */
export function Eyebrow({ children, color = biya.faint }: { children: ReactNode; color?: string }) {
  return (
    <span
      style={{
        fontFamily: font.mono, fontWeight: 400, fontSize: 11, lineHeight: 1.4,
        letterSpacing: "0.07em", textTransform: "uppercase", color,
      }}
    >
      {children}
    </span>
  );
}

/** Section heading with an optional trailing action in indigo. */
export function SectionHead({ children, action, onAction }: { children: ReactNode; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-baseline justify-between" style={{ marginBottom: 11 }}>
      <span style={{ ...type.section, color: biya.ink }}>{children}</span>
      {action && (
        <button onClick={onAction} style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 13, color: biya.action }}>
          {action}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

export function PrimaryButton({
  children, onClick, disabled, height = 52, bg = biya.action, color = "#fff", type: htmlType = "button",
}: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; height?: number;
  bg?: string; color?: string; type?: "button" | "submit";
}) {
  return (
    <button
      type={htmlType}
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 transition-transform active:scale-[0.985] disabled:opacity-45 disabled:active:scale-100"
      style={{
        height, borderRadius: radius.control, backgroundColor: bg,
        fontFamily: font.sans, fontWeight: 600, fontSize: 16, color,
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children, onClick, disabled, height = 52, color = biya.ink,
}: { children: ReactNode; onClick?: () => void; disabled?: boolean; height?: number; color?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 transition-transform active:scale-[0.985] disabled:opacity-45"
      style={{
        height, borderRadius: radius.control, backgroundColor: biya.surface,
        border: `1px solid ${biya.lineStrong}`,
        fontFamily: font.sans, fontWeight: 600, fontSize: 16, color,
      }}
    >
      {children}
    </button>
  );
}

/** Quiet inline action, used for "Finish later" and "Skip for now". */
export function TextButton({ children, onClick, color = biya.muted }: { children: ReactNode; onClick?: () => void; color?: string }) {
  return (
    <button onClick={onClick} className="transition-opacity active:opacity-60" style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 13, color }}>
      {children}
    </button>
  );
}

/** Labelled input on the ground fill. `hint` turns red when `error` is set. */
export function Field({
  label, value, onChange, placeholder, hint, error, type: inputType = "text",
  inputMode, maxLength, autoFocus, right, disabled,
}: {
  label?: string; value: string; onChange?: (v: string) => void; placeholder?: string;
  hint?: string; error?: boolean; type?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "decimal";
  maxLength?: number; autoFocus?: boolean; right?: ReactNode; disabled?: boolean;
}) {
  return (
    <label className="block">
      {label && (
        <span style={{ display: "block", fontFamily: font.sans, fontWeight: 500, fontSize: 12, color: biya.muted, marginBottom: 7 }}>
          {label}
        </span>
      )}
      <span
        className="flex items-center"
        style={{
          height: 52, borderRadius: radius.control, backgroundColor: biya.ground,
          border: `1px solid ${error ? biya.fail : "transparent"}`,
          padding: "0 14px", gap: 8,
        }}
      >
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          type={inputType}
          inputMode={inputMode}
          maxLength={maxLength}
          autoFocus={autoFocus}
          disabled={disabled}
          className="flex-1 min-w-0 bg-transparent outline-none"
          style={{ fontFamily: font.sans, fontWeight: 500, fontSize: 15, color: biya.ink }}
        />
        {right}
      </span>
      {hint && (
        <span style={{ display: "block", fontFamily: font.sans, fontSize: 12, lineHeight: 1.5, color: error ? biya.fail : biya.faint, marginTop: 6 }}>
          {hint}
        </span>
      )}
    </label>
  );
}

/** Segmented control, used for Scan / Transfer / Receive and NIN / BVN. */
export function Segmented({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (k: string) => void }) {
  return (
    <div className="flex" style={{ backgroundColor: biya.ground, borderRadius: radius.soft, padding: 3, gap: 3 }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className="flex-1 transition-colors"
            style={{
              height: 38, borderRadius: 9,
              backgroundColor: on ? biya.surface : "transparent",
              boxShadow: on ? "0 1px 3px rgba(14,17,22,0.10)" : "none",
              fontFamily: font.sans, fontWeight: on ? 600 : 500, fontSize: 13.5,
              color: on ? biya.ink : biya.muted,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export type Status = "completed" | "pending" | "failed" | "tier" | "neutral";

const STATUS_STYLE: Record<Status, { bg: string; fg: string }> = {
  completed: { bg: biya.creditWash, fg: biya.credit },
  pending: { bg: biya.pendingWash, fg: biya.pendingText },
  failed: { bg: biya.failWash, fg: biya.fail },
  tier: { bg: biya.actionWashSoft, fg: biya.action },
  neutral: { bg: biya.ground, fg: biya.muted },
};

export function StatusPill({ status, children }: { status: Status; children: ReactNode }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: radius.pill,
        backgroundColor: s.bg, fontFamily: font.sans, fontWeight: 600, fontSize: 11, lineHeight: 1, color: s.fg,
      }}
    >
      {children}
    </span>
  );
}

/** Monogram tile. Tone carries meaning: credit green in, clay pending, ink self. */
export function Avatar({
  text, size = 38, tone = "neutral", rounded = radius.soft,
}: { text: string; size?: number; tone?: "neutral" | "credit" | "pending" | "ink" | "action"; rounded?: number }) {
  const tones = {
    neutral: { bg: biya.avatar, fg: biya.inkSoft },
    credit: { bg: biya.creditWash, fg: biya.credit },
    pending: { bg: biya.pendingWash, fg: biya.pendingText },
    ink: { bg: biya.ink, fg: "#fff" },
    action: { bg: biya.action, fg: "#fff" },
  }[tone];
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{
        width: size, height: size, borderRadius: rounded === radius.round ? "50%" : rounded,
        backgroundColor: tones.bg, color: tones.fg,
        fontFamily: font.sans, fontWeight: 600, fontSize: Math.round(size * 0.34),
      }}
    >
      {text}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Money
//
// Money numerals are Instrument Sans at display sizes with tight tracking.
// Mono is retained only for the rate, timestamps and reference codes.
// ---------------------------------------------------------------------------

export function Amount({
  currency, value, size = 40, color = biya.ink, weight = 700, sign,
}: {
  currency: "usd" | "ngn"; value: string; size?: number; color?: string; weight?: number;
  sign?: "+" | "-";
}) {
  const glyph = currency === "usd" ? "$" : "₦";
  return (
    <span
      style={{
        fontFamily: font.sans, fontWeight: weight, fontSize: size, lineHeight: 1,
        letterSpacing: size >= 32 ? "-0.035em" : "-0.01em", color, whiteSpace: "nowrap",
      }}
    >
      {sign === "-" ? "−" : sign === "+" ? "+" : ""}
      {glyph}
      {value}
    </span>
  );
}

/** The rate stamp. A converted figure never appears without this beside it. */
export function RateStamp({ rate, at, color = biya.faint }: { rate: string; at?: string; color?: string }) {
  return (
    <span style={{ fontFamily: font.mono, fontWeight: 400, fontSize: 11.5, color }}>
      @ ₦{rate}{at ? ` · ${at}` : ""}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sheets
// ---------------------------------------------------------------------------

export function Sheet({ children, onDismiss }: { children: ReactNode; onDismiss?: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onDismiss}
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(14,17,22,0.42)" }}
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        className="relative"
        style={{
          backgroundColor: biya.surface,
          borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet,
          paddingBottom: "calc(20px + var(--safe-bottom, 0px))",
        }}
      >
        <div className="flex justify-center" style={{ paddingTop: 10, paddingBottom: 4 }}>
          <span style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: "rgba(14,17,22,0.16)" }} />
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Frame
// ---------------------------------------------------------------------------

/** Centres a phone-sized frame on the night ground for desktop, full bleed on mobile. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="size-full min-h-screen flex items-center justify-center overflow-hidden relative" style={{ backgroundColor: biya.dark }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-center justify-center w-full h-full sm:w-[400px] sm:h-[840px]"
        style={{ maxHeight: "100vh" }}
      >
        <div
          className="relative overflow-hidden w-full h-full sm:rounded-[38px]"
          style={{ backgroundColor: biya.ground, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}
        >
          <div className="size-full overflow-hidden relative">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}
