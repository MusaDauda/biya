// Biya design tokens.
//
// Source of truth is the Biya Brand System (direction 1c, "Seal and
// departure"), extended by the Biya Redesign turns for screen level tokens.
// Nothing here is approximated: every hex is lifted from the brand file.
//
// The brand's own names are on the left, the semantic alias this app reads is
// on the right, so a screen asks for `action` and gets Biya Indigo without a
// second opinion about what indigo means.

/** The eight brand colours, under the names the brand system gives them. */
export const brand = {
  indigo: "#4844E0", // icon field, one money-moving action per screen
  ink: "#0E1116",    // wordmark, headings, amounts
  paper: "#F2F3F5",  // app ground, never behind the mark at small size
  night: "#0C0E12",  // dark ground, splash, camera screens
  clay: "#C2603A",   // pending and settlement only, never the mark
  credit: "#0F7A52", // money in, confirmations
  fail: "#C2372B",   // failure and destructive only
  white: "#FFFFFF",  // knockout glyph, surfaces, receipts
} as const;

export const biya = {
  // Text and surfaces
  ink: brand.ink,
  inkSoft: "#3A404B",
  muted: "#5B6270",
  faint: "#8A909C",
  ground: brand.paper,
  surface: brand.white,
  dark: brand.night,

  // The single action colour. Nothing else is indigo.
  action: brand.indigo,
  actionDeep: "#2B27A8",
  actionWash: "rgba(72,68,224,0.13)",
  actionWashSoft: "rgba(72,68,224,0.10)",
  actionShadow: "rgba(72,68,224,0.32)",

  // Money states. Clay is pending and settlement, never decoration.
  pending: brand.clay,
  pendingText: "#A54D2C",
  pendingWash: "rgba(194,96,58,0.13)",
  credit: brand.credit,
  creditWash: "rgba(15,122,82,0.12)",
  fail: brand.fail,
  failWash: "rgba(194,55,43,0.10)",

  // Rules and fills
  line: "rgba(14,17,22,0.10)",
  lineStrong: "rgba(14,17,22,0.14)",
  hairline: "rgba(14,17,22,0.06)",
  avatar: "#EDEEF2",
  disabled: "#DCDDE3",
} as const;

/**
 * Mark geometry, taken from the brand system rather than eyeballed.
 * Ratios are expressed against the icon's rendered size.
 */
export const mark = {
  /** Below this the full icon is not used. The monogram takes over. */
  minIcon: 24,
  /** Nothing carries the mark below this at all. */
  minMonogram: 16,
  /** Narrowest the horizontal lockup may be drawn. */
  minLockup: 88,
  /** One dot diameter on all four sides, a quarter of the icon height. */
  clearSpace: 0.25,
  /** Wordmark cap size against icon size, from the 168x48 lockup. */
  wordmarkScale: 32 / 48,
  /** Gap between tile and wordmark, from the same lockup. */
  wordmarkGap: 14 / 48,
  /** letter-spacing -1.4 at 32px. */
  wordmarkTracking: "-0.044em",
} as const;

// Instrument Sans carries money at display sizes with tight tracking. Space
// Mono is retained only for rates, timestamps and reference codes, where
// alignment and machine-ness are the point.
export const font = {
  sans: "'Instrument Sans', system-ui, sans-serif",
  mono: "'Space Mono', ui-monospace, monospace",
} as const;

// The type scale, straight off the foundations card.
export const type = {
  balance: { fontFamily: font.sans, fontWeight: 700, fontSize: 40, lineHeight: 1, letterSpacing: "-0.035em" },
  balanceLg: { fontFamily: font.sans, fontWeight: 700, fontSize: 46, lineHeight: 1, letterSpacing: "-0.04em" },
  title: { fontFamily: font.sans, fontWeight: 600, fontSize: 22, lineHeight: 1.15, letterSpacing: "-0.02em" },
  section: { fontFamily: font.sans, fontWeight: 600, fontSize: 17, lineHeight: 1.2 },
  row: { fontFamily: font.sans, fontWeight: 600, fontSize: 15, lineHeight: 1.2 },
  rowSm: { fontFamily: font.sans, fontWeight: 600, fontSize: 14.5, lineHeight: 1.2 },
  body: { fontFamily: font.sans, fontWeight: 400, fontSize: 13, lineHeight: 1.55 },
  bodySm: { fontFamily: font.sans, fontWeight: 400, fontSize: 12, lineHeight: 1.4 },
  mono: { fontFamily: font.mono, fontWeight: 400, fontSize: 12, lineHeight: 1.4 },
  monoSm: { fontFamily: font.mono, fontWeight: 400, fontSize: 11, lineHeight: 1.4 },
} as const;

// Uppercase mono eyebrow, used above every value block.
export const eyebrow = {
  fontFamily: font.mono,
  fontWeight: 400,
  fontSize: 11,
  lineHeight: 1.4,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: biya.faint,
} as const;

export const radius = {
  sheet: 22,
  card: 16,
  control: 14,
  soft: 12,
  pill: 7,
  round: 999,
} as const;

export const DAY = 86400000;

// ---------------------------------------------------------------------------
// Money formatting.
//
// Everything crossing the API boundary is an integer in minor units: USD cents,
// NGN kobo. These are the only place a minor-unit integer becomes a string, and
// they are the only place a division by 100 is allowed to happen.
// ---------------------------------------------------------------------------

/** NGN kobo to a naira string. `formatNgn(120000)` is "1,200.00". */
export function formatNgn(kobo: number, withDecimals = true): string {
  return (kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  });
}

/** USD cents to a dollar string. `formatUsd(5000)` is "50.00". */
export function formatUsd(cents: number, withDecimals = true): string {
  return (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  });
}

/** A rate is a decimal, not minor units. `formatRate(1548.2)` is "1,548.20". */
export function formatRate(rate: number): string {
  return rate.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Clock time for the rate stamp and activity rows. */
export function clockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

/** Two-letter monogram for an avatar tile. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
