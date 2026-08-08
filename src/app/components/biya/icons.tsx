import type { ReactNode } from "react";
import { biya } from "./theme";

// Icons drawn to the design's own geometry: 24 unit box, 1.8 stroke, round
// joins. Tab icons ship in both stroke and solid, because the active state
// carries three signals and the stroke-to-solid switch is one of them.
type P = { size?: number; color?: string; solid?: boolean };

const S = (p: P) => ({
  width: p.size ?? 20,
  height: p.size ?? 20,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  "aria-hidden": true,
});

export function HomeIcon(p: P) {
  const c = p.color ?? biya.muted;
  const d = "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z";
  return <svg {...S(p)}>{p.solid ? <path d={d} fill={c} /> : <path d={d} stroke={c} strokeWidth="1.8" strokeLinejoin="round" />}</svg>;
}

export function ActivityIcon(p: P) {
  const c = p.color ?? biya.muted;
  const bars = [
    { x: 4, y: 13, h: 7 },
    { x: 10.3, y: 8, h: 12 },
    { x: 16.6, y: 4, h: 16 },
  ];
  return (
    <svg {...S(p)}>
      {bars.map((b, i) =>
        p.solid
          ? <rect key={i} x={b.x} y={b.y} width="3.4" height={b.h} rx="1.7" fill={c} />
          : <rect key={i} x={b.x} y={b.y} width="3.4" height={b.h} rx="1.7" stroke={c} strokeWidth="1.8" />,
      )}
    </svg>
  );
}

export function ChatIcon(p: P) {
  const c = p.color ?? biya.muted;
  const d = "M4 8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-5 4z";
  return <svg {...S(p)}>{p.solid ? <path d={d} fill={c} /> : <path d={d} stroke={c} strokeWidth="1.8" strokeLinejoin="round" />}</svg>;
}

export function ProfileIcon(p: P) {
  const c = p.color ?? biya.muted;
  return (
    <svg {...S(p)}>
      {p.solid ? (
        <>
          <circle cx="12" cy="8.5" r="3.8" fill={c} />
          <path d="M5 20a7 7 0 0 1 14 0z" fill={c} />
        </>
      ) : (
        <>
          <circle cx="12" cy="8.5" r="3.8" stroke={c} strokeWidth="1.8" />
          <path d="M5 20a7 7 0 0 1 14 0" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/** The centre action in personal context: an outgoing arrow. */
export function PayIcon({ size = 24, color = "#fff", struck = false }: { size?: number; color?: string; struck?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 17 17 7M9.5 7H17v7.5" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      {struck && <path d="M4 20 20 4" stroke={color} strokeWidth="2.1" strokeLinecap="round" />}
    </svg>
  );
}

/** The centre action in business context: a payment code. A vendor shows, not sends. */
export function CollectIcon({ size = 24, color = "#fff", struck = false }: { size?: number; color?: string; struck?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" stroke={color} strokeWidth="2" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" stroke={color} strokeWidth="2" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" stroke={color} strokeWidth="2" />
      <path d="M14 14v2m0 4h2m4-6v6m-4-6h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {struck && <path d="M4 20 20 4" stroke={color} strokeWidth="2.1" strokeLinecap="round" />}
    </svg>
  );
}

export function ChevronRight({ size = 18, color = biya.faint }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 5l7 7-7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDown({ size = 14, color = biya.faint }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 9l7 7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ size = 20, color = biya.credit, weight = 2.4 }: { size?: number; color?: string; weight?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12.5 10 17.5 19 7" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AlertIcon({ size = 22, color = biya.fail }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.9" />
      <path d="M12 7.5v5.5" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="12" cy="16.4" r="1.15" fill={color} />
    </svg>
  );
}

export function ClockIcon({ size = 20, color = biya.pendingText }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.9" />
      <path d="M12 7v5.2l3.2 2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CopyIcon({ size = 17, color = biya.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2.5" stroke={color} strokeWidth="1.8" />
      <path d="M15 6.5A2.5 2.5 0 0 0 12.5 4H6.5A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ShareIcon({ size = 17, color = biya.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 15V4m0 0L8.2 7.8M12 4l3.8 3.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ size = 18, color = biya.ink }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

/** Money leaving, on a withdraw action. Down is out of Biya, into a bank. */
export function ArrowDownIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 19V5M12 19l-5.5-5.5M12 19l5.5-5.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Up and to the right of a number: this figure is above the one before it. */
export function ArrowUpIcon({ size = 16, color = biya.credit }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 19V5M12 5 6.5 10.5M12 5l5.5 5.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TorchIcon({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2 5 13h5.5L10 22l8-11h-5.5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function GalleryIcon({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="14" rx="2.6" stroke={color} strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1.6" stroke={color} strokeWidth="1.6" />
      <path d="m4.5 17 4.6-4.2a1.8 1.8 0 0 1 2.4 0L16 17" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SparkIcon({ size = 18, color = biya.action }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3.5 13.9 9 19.5 11 13.9 13 12 18.5 10.1 13 4.5 11 10.1 9z" fill={color} />
    </svg>
  );
}

export function OfflineIcon({ size = 20, color = biya.pendingText }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8.5a13 13 0 0 1 16 0M7 12a8.6 8.6 0 0 1 10 0M10 15.4a4 4 0 0 1 4 0" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="12" cy="19" r="1.2" fill={color} />
      <path d="M4 20 20 4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function LockIcon({ size = 16, color = biya.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4.5" y="10" width="15" height="10.5" rx="2.6" stroke={color} strokeWidth="1.8" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The extension set, from Biya Icon Set.dc.html.
//
// Fifteen outline icons drawn to the same geometry as everything above: 24 unit
// box, 1.8 stroke, round caps and joins, one colour the caller overrides. None
// of them need a solid variant, because only the tab bar switches on active.
//
// The frame is shared rather than repeated per icon so a later addition cannot
// quietly drift to a different stroke weight or cap style.
// ---------------------------------------------------------------------------

type IP = { size?: number; color?: string };

function Outline({ size = 20, color = biya.muted, children }: IP & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

// --- funding rails ---------------------------------------------------------
// These five appear stacked in one list on Add money, so they are drawn to be
// told apart from each other rather than to be individually clever.

/** Test funds. A demo control that mints money from nothing. */
export function DropletIcon(p: IP) {
  return (
    <Outline {...p}>
      <path d="M12 3.4c3.3 3.7 5.3 6.4 5.3 8.8a5.3 5.3 0 0 1-10.6 0c0-2.4 2-5.1 5.3-8.8Z" />
    </Outline>
  );
}

/** Stablecoin. Discs, with no currency symbol and no chain motif. */
export function CoinsIcon(p: IP) {
  return (
    <Outline {...p}>
      <circle cx="9.2" cy="9.2" r="5.6" />
      <circle cx="9.2" cy="9.2" r="2.1" />
      <circle cx="14.8" cy="14.8" r="5.6" />
    </Outline>
  );
}

/** Bank transfer in. */
export function LandmarkIcon(p: IP) {
  return (
    <Outline {...p}>
      <path d="M3 9.6 12 4.2l9 5.4" />
      <path d="M5.6 9.6v8.2M10 9.6v8.2M14 9.6v8.2M18.4 9.6v8.2" />
      <path d="M3.6 20.4h16.8" />
    </Outline>
  );
}

/** A partner company. Deliberately an office block, so it is not the Landmark. */
export function BuildingIcon(p: IP) {
  return (
    <Outline {...p}>
      <rect x="5.2" y="3.6" width="13.6" height="16.8" rx="1.8" />
      <path d="M9 8h2M13 8h2M9 12h2M13 12h2" />
      <path d="M10.2 20.4v-4h3.6v4" />
    </Outline>
  );
}

/** Withdraw to a bank. */
export function BanknoteIcon(p: IP) {
  return (
    <Outline {...p}>
      <rect x="2.6" y="6.4" width="18.8" height="11.2" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
    </Outline>
  );
}

// --- money direction -------------------------------------------------------
// Receive and Withdraw hold the same tray and move only the arrow, so the pair
// reads as opposites at a glance.

/** Money in. Request, and incoming activity. */
export function ReceiveIcon(p: IP) {
  return (
    <Outline {...p}>
      <path d="M4 13.8v3.6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.6" />
      <path d="M12 3.6v9.2" />
      <path d="M8.4 9.2 12 12.8l3.6-3.6" />
    </Outline>
  );
}

/** Add money. */
export function WalletIcon(p: IP) {
  return (
    <Outline {...p}>
      <rect x="3" y="6" width="18" height="13" rx="2.4" />
      <path d="M3 10.4h18" />
      <path d="M16.6 12.6H21v4h-4.4a2 2 0 0 1 0-4Z" />
    </Outline>
  );
}

/** Money out. */
export function WithdrawIcon(p: IP) {
  return (
    <Outline {...p}>
      <path d="M4 13.8v3.6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.6" />
      <path d="M12 12.8V3.6" />
      <path d="M8.4 7.2 12 3.6l3.6 3.6" />
    </Outline>
  );
}

// --- profile and settings --------------------------------------------------

/** A savings target. Rings rather than a piggy bank, which is too illustrative. */
export function GoalIcon(p: IP) {
  return (
    <Outline {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.2" />
    </Outline>
  );
}

/** A scheduled payment. A calendar carrying a repeat. */
export function ScheduledIcon(p: IP) {
  return (
    <Outline {...p}>
      <rect x="3.4" y="5" width="17.2" height="15.4" rx="2.4" />
      <path d="M8 3.2v3.6M16 3.2v3.6M3.4 10h17.2" />
      <path d="M14.8 16.2a2.9 2.9 0 1 1-1.1-2.3" />
      <path d="M15.2 12.6v2.1h-2.1" />
    </Outline>
  );
}

/** A shop or business. */
export function StoreIcon(p: IP) {
  return (
    <Outline {...p}>
      <path d="M3 9.6 4.8 4.8h14.4L21 9.6" />
      <path d="M3 9.6h18" />
      <path d="M4.8 9.6v10.8h14.4V9.6" />
      <path d="M10 20.4v-5.2h4v5.2" />
    </Outline>
  );
}

export function ShieldIcon(p: IP) {
  return (
    <Outline {...p}>
      <path d="M12 3.4 5 6.2v5.4c0 4.2 2.9 7.4 7 9.2 4.1-1.8 7-5 7-9.2V6.2Z" />
    </Outline>
  );
}

export function BellIcon(p: IP) {
  return (
    <Outline {...p}>
      <path d="M6 10.6a6 6 0 1 1 12 0v5.2l1.6 2.4H4.4L6 15.8Z" />
      <path d="M9.8 18.2a2.3 2.3 0 0 0 4.4 0" />
    </Outline>
  );
}

export function HelpIcon(p: IP) {
  return (
    <Outline {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M9.7 9.7a2.4 2.4 0 1 1 3.3 2.2c-.7.3-1 .9-1 1.6v.4" />
      {/* Zero length, so the round cap draws the full stop under the question. */}
      <path d="M12 17.1h.01" />
    </Outline>
  );
}

export function LogOutIcon(p: IP) {
  return (
    <Outline {...p}>
      <path d="M13.4 20.4H6.6a2 2 0 0 1-2-2V5.6a2 2 0 0 1 2-2h6.8" />
      <path d="M11 12h9.4" />
      <path d="M17 8.6 20.4 12 17 15.4" />
    </Outline>
  );
}
