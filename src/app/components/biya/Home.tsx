import type { ReactNode } from "react";
import {
  biya, clockTime, DAY, font, formatNgn, formatRate, formatUsd, initials, type,
} from "./theme";
import { Avatar, Card, Eyebrow, SectionHead, Sheet } from "./primitives";
import { ChevronDown, ChevronRight, PlusIcon } from "./icons";
import type { ActivityRow, Balances, BusinessAccount, FxSnapshot, Me } from "../../../lib/api";

// Home in both contexts, plus the switch between them.
//
// Personal and business sit behind a switch at the top. Switching changes this
// screen and the money being spent. The tabs never change under you, which is
// the whole reason there is one app rather than two.

export type Context = { kind: "personal" } | { kind: "business"; account: BusinessAccount };

export function Home(props: {
  user: Me;
  balances: Balances;
  activity: ActivityRow[];
  fx: FxSnapshot | null;
  context: Context;
  businesses: BusinessAccount[];
  offline?: boolean;
  onSwitch: (id: string) => void;
  onAddBusiness: () => void;
  onRequest: () => void;
  onAddMoney: () => void;
  onWithdraw: () => void;
  onViewAll: () => void;
  onRetry: () => void;
}) {
  return props.context.kind === "business"
    ? <BusinessHome {...props} account={props.context.account} />
    : <PersonalHome {...props} />;
}

// ---------------------------------------------------------------------------
// The switch
// ---------------------------------------------------------------------------

function ContextChip({
  label, mono, onClick,
}: { label: string; mono: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center transition-transform active:scale-[0.97]"
      style={{
        gap: 9, backgroundColor: biya.surface, border: `1px solid ${biya.line}`,
        borderRadius: 999, padding: "5px 12px 5px 5px",
      }}
    >
      <Avatar text={mono} size={28} tone="ink" rounded={999} />
      <span style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 13.5, color: biya.ink }}>{label}</span>
      <ChevronDown />
    </button>
  );
}

export function ContextSwitchSheet({
  user, balances, businesses, current, onPick, onAddBusiness, onDismiss,
}: {
  user: Me;
  balances: Balances;
  businesses: BusinessAccount[];
  current: string;
  onPick: (id: string) => void;
  onAddBusiness: () => void;
  onDismiss: () => void;
}) {
  return (
    <Sheet onDismiss={onDismiss}>
      <div style={{ padding: "10px 20px 4px" }}>
        <span style={{ ...type.title, fontSize: 19, color: biya.ink }}>Switch account</span>
      </div>

      <div style={{ padding: "14px 20px 0" }}>
        <Card>
          <SwitchRow
            mono={initials(user.display_name || user.email)}
            name="Personal"
            detail={`$${formatUsd(balances.usdMinor)} · Tier ${user.kyc_tier}`}
            active={current === "personal"}
            onClick={() => onPick("personal")}
          />
          {businesses.map((b, i) => (
            <SwitchRow
              key={b.id}
              mono={initials(b.name)}
              name={b.name}
              detail={`Business · ${b.receiveCode}`}
              active={current === b.id}
              last={i === businesses.length - 1}
              onClick={() => onPick(b.id)}
            />
          ))}
        </Card>

        <button
          onClick={onAddBusiness}
          className="w-full flex items-center transition-opacity active:opacity-70"
          style={{ gap: 12, padding: "16px 2px 4px" }}
        >
          <span
            className="flex items-center justify-center"
            style={{ width: 38, height: 38, borderRadius: 12, border: `1px dashed ${biya.lineStrong}` }}
          >
            <PlusIcon size={17} color={biya.muted} />
          </span>
          <span style={{ ...type.row, color: biya.ink }}>Add another business</span>
        </button>

        <p style={{ ...type.body, color: biya.faint, marginTop: 12 }}>
          Switching changes the home screen and the money you are spending. The tabs stay where they are.
        </p>
      </div>
    </Sheet>
  );
}

function SwitchRow({
  mono, name, detail, active, last, onClick,
}: { mono: string; name: string; detail: string; active: boolean; last?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center text-left transition-colors"
      style={{
        gap: 12, padding: "13px 14px",
        borderBottom: last === undefined || last ? "none" : `1px solid ${biya.hairline}`,
        backgroundColor: active ? biya.actionWashSoft : "transparent",
      }}
    >
      <Avatar text={mono} size={38} tone={active ? "action" : "neutral"} />
      <span className="flex-1 min-w-0">
        <span className="block truncate" style={{ ...type.rowSm, color: biya.ink }}>{name}</span>
        <span className="block truncate" style={{ ...type.bodySm, color: biya.faint, marginTop: 2 }}>{detail}</span>
      </span>
      {active && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5 10 17.5 19 7" stroke={biya.action} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// B1, personal
// ---------------------------------------------------------------------------

function PersonalHome({
  user, balances, activity, fx, businesses, offline, onSwitch, onAddBusiness,
  onRequest, onAddMoney, onWithdraw, onViewAll, onRetry,
}: Parameters<typeof Home>[0]) {
  const groups = groupByDay(activity);

  return (
    <Screenful
      chip={<ContextChip label="Personal" mono={initials(user.display_name || user.email)} onClick={() => onSwitch("open")} />}
    >
      {offline && <OfflineBanner fx={fx} onRetry={onRetry} />}

      <div style={{ padding: "26px 20px 0" }}>
        <Eyebrow>{offline ? "Your dollars, last known" : "Your dollars"}</Eyebrow>
        <div style={{ ...type.balanceLg, color: biya.ink, marginTop: 9 }}>
          ${formatUsd(balances.usdMinor)}
        </div>
        <div className="flex items-baseline" style={{ gap: 8, marginTop: 9, flexWrap: "wrap" }}>
          <span style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 16, color: biya.inkSoft }}>
            ₦{formatNgn(nairaValue(balances.usdMinor, fx))}
          </span>
          {fx && (
            <span style={{ fontFamily: font.mono, fontSize: 11.5, color: biya.faint }}>
              @ ₦{formatRate(fx.effectiveRate)} · {clockTime(fx.fetchedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Pay is the raised centre action in the tab bar, so it is deliberately
          absent here. These three are the rest of the money surface. */}
      <div className="flex" style={{ gap: 8, padding: "20px 20px 0" }}>
        <QuietAction label="Request" onClick={onRequest} />
        <QuietAction label="Add money" onClick={onAddMoney} />
        <QuietAction label={offline ? "My code" : "Withdraw"} onClick={offline ? onRequest : onWithdraw} />
      </div>

      {offline && (
        <p style={{ ...type.body, color: biya.muted, padding: "14px 20px 0" }}>
          Your code still works offline. Anyone can pay you now, and it will appear here once you are back on.
        </p>
      )}

      <div style={{ padding: "24px 20px 0" }}>
        <SectionHead action={activity.length ? "See all" : undefined} onAction={onViewAll}>Activity</SectionHead>

        {activity.length === 0 ? (
          <EmptyActivity onAddMoney={onAddMoney} />
        ) : (
          groups.map((g) => (
            <div key={g.label} style={{ marginBottom: 14 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontFamily: font.mono, fontSize: 10.5, letterSpacing: "0.07em", textTransform: "uppercase", color: biya.faint }}>
                  {g.label}
                </span>
              </div>
              <Card>
                {g.rows.map((row, i) => (
                  <ActivityLine key={row.id} row={row} last={i === g.rows.length - 1} />
                ))}
              </Card>
            </div>
          ))
        )}
      </div>
    </Screenful>
  );
}

// ---------------------------------------------------------------------------
// B3, business
// ---------------------------------------------------------------------------

function BusinessHome({
  account, activity, balances, businesses, user, onSwitch, onViewAll,
}: Parameters<typeof Home>[0] & { account: BusinessAccount }) {
  const today = activity.filter((r) => r.ngnMinor > 0 && r.createdAt >= startOfToday());
  const yesterday = activity.filter(
    (r) => r.ngnMinor > 0 && r.createdAt < startOfToday() && r.createdAt >= startOfToday() - DAY,
  );
  const takenKobo = today.reduce((s, r) => s + r.ngnMinor, 0);
  const yesterdayKobo = yesterday.reduce((s, r) => s + r.ngnMinor, 0);
  const delta = takenKobo - yesterdayKobo;

  return (
    <Screenful chip={<ContextChip label={account.name} mono={initials(account.name)} onClick={() => onSwitch("open")} />}>
      <div style={{ padding: "26px 20px 0" }}>
        <Eyebrow>Business balance</Eyebrow>
        <div style={{ ...type.balanceLg, color: biya.ink, marginTop: 9 }}>
          ₦{formatNgn(balances.ngnMinor)}
        </div>
        <div className="flex items-baseline" style={{ gap: 6, marginTop: 9, flexWrap: "wrap" }}>
          <span style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 15, color: biya.inkSoft }}>
            {today.length} {today.length === 1 ? "payment today" : "payments today"}
          </span>
          {yesterdayKobo > 0 && (
            <span style={{ ...type.body, color: biya.faint }}>
              · ₦{formatNgn(Math.abs(delta), false)} {delta >= 0 ? "more" : "less"} than yesterday
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        <SectionHead action={today.length ? "See all" : undefined} onAction={onViewAll}>Customers today</SectionHead>
        {today.length === 0 ? (
          <Card>
            <div className="text-center" style={{ padding: "34px 24px" }}>
              <p style={{ ...type.row, fontSize: 16, color: biya.ink }}>No payments yet today</p>
              <p style={{ ...type.body, color: biya.faint, marginTop: 6 }}>
                Tap Collect and show your code. Payments land here as they happen.
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            {today.map((row, i) => (
              <CustomerLine key={row.id} row={row} last={i === today.length - 1} />
            ))}
          </Card>
        )}
      </div>
    </Screenful>
  );
}

function CustomerLine({ row, last }: { row: ActivityRow; last: boolean }) {
  const name = row.counterparty ?? "Payment received";
  return (
    <div className="flex items-center" style={{ gap: 12, padding: "13px 14px", borderBottom: last ? "none" : `1px solid ${biya.hairline}` }}>
      <Avatar text={initials(name)} size={38} tone="credit" />
      <div className="flex-1 min-w-0">
        <div className="truncate" style={{ ...type.rowSm, color: biya.ink }}>{name}</div>
        <div style={{ ...type.bodySm, color: biya.faint, marginTop: 2 }}>
          {clockTime(row.createdAt)} · {row.memo ? row.memo : "Code"}
        </div>
      </div>
      <div style={{ ...type.rowSm, color: biya.credit }}>+₦{formatNgn(row.ngnMinor)}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

function Screenful({ chip, children }: { chip: ReactNode; children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: biya.ground, paddingBottom: 132 }}>
      <div
        className="flex items-center justify-between"
        style={{ padding: "10px 20px 0", paddingTop: "calc(10px + var(--safe-top, 0px))" }}
      >
        {chip}
      </div>
      {children}
    </div>
  );
}

function QuietAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center transition-transform active:scale-[0.97]"
      style={{
        height: 44, borderRadius: 12, backgroundColor: biya.surface,
        border: `1px solid ${biya.line}`,
        fontFamily: font.sans, fontWeight: 600, fontSize: 13.5, color: biya.ink,
      }}
    >
      {label}
    </button>
  );
}

function OfflineBanner({ fx, onRetry }: { fx: FxSnapshot | null; onRetry: () => void }) {
  return (
    <div style={{ padding: "14px 20px 0" }}>
      <Card style={{ borderColor: biya.pendingWash, backgroundColor: biya.pendingWash }}>
        <div style={{ padding: "13px 15px" }}>
          <div style={{ ...type.row, fontSize: 14.5, color: biya.pendingText }}>You are offline</div>
          <p style={{ ...type.body, color: biya.pendingText, marginTop: 4, opacity: 0.9 }}>
            Figures below were last checked at {fx ? clockTime(fx.fetchedAt) : "your last connection"}. You cannot send until the connection returns.
          </p>
          <button onClick={onRetry} style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 13, color: biya.pendingText, marginTop: 8, textDecoration: "underline" }}>
            Retry now
          </button>
        </div>
      </Card>
    </div>
  );
}

/**
 * One row answers "did money come in or go out, and how much of which
 * currency". A payment costs dollars and delivers naira, so both can be non
 * zero on the same row. The dominant figure is whichever one moved for this
 * user, with the other beneath it in mono.
 */
export function ActivityLine({ row, last }: { row: ActivityRow; last?: boolean }) {
  const incoming = row.usdMinor > 0 || (row.usdMinor === 0 && row.ngnMinor > 0);
  const pending = row.kind === "bank_payout";

  const title = row.counterparty
    ?? (row.kind === "usdt_deposit" ? "Money added"
      : row.kind === "test_credit" ? "Money added"
      : row.kind === "goal_release" ? "Moved to spendable"
      : row.kind === "bank_payout" ? "To your bank"
      : "Transaction");

  const primary = row.usdMinor !== 0
    ? `${row.usdMinor > 0 ? "+" : "−"}$${formatUsd(Math.abs(row.usdMinor))}`
    : `${row.ngnMinor > 0 ? "+" : "−"}₦${formatNgn(Math.abs(row.ngnMinor))}`;
  const secondary = row.usdMinor !== 0 && row.ngnMinor !== 0
    ? `₦${formatNgn(Math.abs(row.ngnMinor))}`
    : null;

  return (
    <div className="flex items-center" style={{ gap: 12, padding: "13px 14px", borderBottom: last ? "none" : `1px solid ${biya.hairline}` }}>
      <Avatar text={initials(title)} size={38} tone={pending ? "pending" : incoming ? "credit" : "neutral"} />
      <div className="flex-1 min-w-0">
        <div className="truncate" style={{ ...type.rowSm, color: biya.ink }}>{title}</div>
        <div className="truncate" style={{ ...type.bodySm, color: pending ? biya.pendingText : biya.faint, marginTop: 2 }}>
          {clockTime(row.createdAt)} · {pending ? "Pending" : row.memo || describe(row.kind)}
        </div>
      </div>
      <div className="text-right shrink-0" style={{ paddingLeft: 8 }}>
        <div style={{ ...type.rowSm, color: incoming ? biya.credit : biya.ink }}>{primary}</div>
        {secondary && (
          <div style={{ fontFamily: font.mono, fontSize: 11.5, color: biya.faint, marginTop: 2 }}>{secondary}</div>
        )}
      </div>
    </div>
  );
}

function EmptyActivity({ onAddMoney }: { onAddMoney: () => void }) {
  return (
    <Card>
      <div className="flex flex-col items-center text-center" style={{ padding: "36px 24px" }}>
        <span
          className="flex items-center justify-center"
          style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: biya.actionWashSoft, marginBottom: 14 }}
        >
          <PlusIcon size={22} color={biya.action} />
        </span>
        <p style={{ ...type.row, fontSize: 16, color: biya.ink }}>Add dollars to start</p>
        <p style={{ ...type.body, color: biya.faint, marginTop: 6, marginBottom: 16 }}>
          Once there are dollars here you can pay anyone in naira, at a rate you see before you send.
        </p>
        <button
          onClick={onAddMoney}
          className="flex items-center transition-transform active:scale-[0.97]"
          style={{
            gap: 6, height: 44, padding: "0 20px", borderRadius: 12,
            backgroundColor: biya.action, fontFamily: font.sans, fontWeight: 600, fontSize: 14, color: "#fff",
          }}
        >
          Add money
          <ChevronRight size={16} color="#fff" />
        </button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function describe(kind: string): string {
  if (kind === "payment") return "Paid by code";
  if (kind === "mandate_run") return "Scheduled payment";
  if (kind === "test_credit" || kind === "usdt_deposit") return "Added";
  if (kind === "goal_release") return "From savings";
  return "Transaction";
}

export function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function groupByDay(rows: ActivityRow[]): { label: string; rows: ActivityRow[] }[] {
  const out: { label: string; rows: ActivityRow[] }[] = [];
  const label = (ts: number) => {
    if (ts >= startOfToday()) return "Today";
    if (ts >= startOfToday() - DAY) return "Yesterday";
    return "Earlier";
  };
  for (const r of rows.slice(0, 12)) {
    const l = label(r.createdAt);
    const bucket = out.find((g) => g.label === l);
    if (bucket) bucket.rows.push(r);
    else out.push({ label: l, rows: [r] });
  }
  return out;
}

/** A converted figure never appears without the rate that produced it. */
function nairaValue(usdMinor: number, fx: FxSnapshot | null): number {
  if (!fx) return 0;
  return Math.round(usdMinor * fx.effectiveRate);
}
