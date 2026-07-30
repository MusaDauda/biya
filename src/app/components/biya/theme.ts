// Biya design tokens, derived from the imported Figma frames.
export const biya = {
  cream: "#fbf9f6",
  surface: "#ffffff",
  ink: "#000218",
  navy: "#141b3c",
  marigold: "#feae2c",
  gold: "#835500",
  goldDeep: "#6b4500",
  peach: "#ffddb4",
  green: "#1fa463",
  greenSoft: "#82fab0",
  greenText: "#029959",
  red: "#ba1a1a",
  gray: "#71717a",
  grayAlt: "#76767f",
  line: "rgba(20,27,60,0.1)",
  mute: "#eae8e5",
  muteAlt: "#f5f3f0",
  muteDeep: "#e4e2df",
} as const;

// Font family helpers (fonts loaded in styles/fonts.css)
export const font = {
  display: "'Outfit', sans-serif",
  mono: "'JetBrains Mono', monospace",
  serif: "'Liberation Serif', 'Times New Roman', serif",
} as const;

export const USDT_RATE = 1481;

export const DAY = 86400000;

export function formatNaira(value: number, withDecimals = false): string {
  return value.toLocaleString("en-NG", {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  });
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

export function toUsdt(naira: number): string {
  return (naira / USDT_RATE).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
