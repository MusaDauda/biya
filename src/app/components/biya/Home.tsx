import type { ReactNode } from "react";
import {
  biya, clockTime, DAY, font, formatNgn, formatRate, formatUsd, initials, type,
} from "./theme";
import { Avatar, Card, Eyebrow, SectionHead, Sheet } from "./primitives";
import {
  ArrowDownIcon, ArrowUpIcon, ChevronDown, ChevronRight, CollectIcon, PlusIcon,
  ReceiveIcon, WalletIcon, WithdrawIcon,
} from "./icons";
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
  /** Business home offers savings as the other thing to do with a balance. */
  onGoal: () => void;
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
        <QuietAction
          label="Request"
          onClick={onRequest}
          icon={<ReceiveIcon size={17} color={biya.muted} />}
        />
        <QuietAction
          label="Add money"
          onClick={onAddMoney}
          icon={<WalletIcon size={17} color={biya.muted} />}
        />
        {/* Offline the centre action is dead, so this slot becomes the way to
            get paid instead, and the icon has to follow the label. */}
        <QuietAction
          label={offline ? "My code" : "Withdraw"}
          onClick={offline ? onRequest : onWithdraw}
          icon={
            offline
              ? <CollectIcon size={17} color={biya.muted} />
              : <WithdrawIcon size={17} color={biya.muted} />
          }
        />
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
  account, activity, balances, fx, onSwitch, onViewAll, onWithdraw, onGoal,
}: Parameters<typeof Home>[0] & { account: BusinessAccount }) {
  const today = activity.filter((r) => r.ngnMinor > 0 && r.createdAt >= startOfToday());
  const yesterday = activity.filter(
    (r) => r.ngnMinor > 0 && r.createdAt < startOfToday() && r.createdAt >= startOfToday() - DAY,
  );
  const takenKobo = today.reduce((s, r) => s + r.ngnMinor, 0);
  const yesterdayKobo = yesterday.reduce((s, r) => s + r.ngnMinor, 0);
  const delta = takenKobo - yesterdayKobo;
  const week = dailyTotals(activity, 7);

  return (
    <Screenful chip={<ContextChip label={account.name} mono={initials(account.name)} onClick={() => onSwitch("open")} />}>
      <div style={{ padding: "22px 20px 0" }}>
        <Eyebrow>Business balance</Eyebrow>
        <div style={{ ...type.balance, fontSize: 42, letterSpacing: "-0.045em", color: biya.ink, marginTop: 11 }}>
          ₦{formatNgn(balances.ngnMinor)}
        </div>
        <div style={{ ...type.body, fontSize: 13.5, color: biya.muted, marginTop: 10 }}>
          {fx ? `$${formatUsd(dollarValue(balances.ngnMinor, fx))} · available now` : "Available now"}
        </div>
      </div>

      {/* Two ways out of this balance, both of which the person chooses. There
          is no settlement here: money that has landed has landed. */}
      <div className="flex" style={{ gap: 9, padding: "20px 20px 0" }}>
        <SolidAction label="Withdraw" onClick={onWithdraw} icon={<ArrowDownIcon size={16} />} />
        <QuietAction label="Move to savings" onClick={onGoal} icon={<PlusIcon size={16} color={biya.ink} />} />
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        <Card>
          <div style={{ padding: "17px 18px 18px" }}>
            <div className="flex items-center justify-between" style={{ gap: 10 }}>
              <span style={{ ...type.row, color: biya.ink }}>Incoming today</span>
              <span style={{ fontFamily: font.mono, fontSize: 11, color: biya.faint }}>
                {today.length} {today.length === 1 ? "payment" : "payments"}
              </span>
            </div>

            <div style={{ fontFamily: font.sans, fontWeight: 700, fontSize: 27, lineHeight: 1, letterSpacing: "-0.035em", color: takenKobo > 0 ? biya.credit : biya.faint, marginTop: 13 }}>
              +₦{formatNgn(takenKobo)}
            </div>

            <WeekBars values={week} />

            <div className="flex items-center justify-between" style={{ marginTop: 9, fontFamily: font.mono, fontSize: 10.5, color: biya.faint }}>
              <span>Last 7 days</span>
              {yesterdayKobo > 0 && delta !== 0 && (
                <span className="inline-flex items-center" style={{ gap: 5, color: delta > 0 ? biya.credit : biya.muted }}>
                  <ArrowUpIcon
                    size={11}
                    color={delta > 0 ? biya.credit : biya.muted}
                  />
                  ₦{formatNgn(Math.abs(delta), false)} {delta > 0 ? "above" : "below"} yesterday
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: "26px 20px 0" }}>
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
              <CustomerLine key={row.id} row={row} fx={fx} last={i === today.length - 1} />
            ))}
          </Card>
        )}
      </div>
    </Screenful>
  );
}

/**
 * Seven days of takings, oldest on the left. Bars are relative to the best day
 * in the window, so the shape is honest even when every day is small, and the
 * last bar is today's, which is the one being read.
 */
function WeekBars({ values }: { values: number[] }) {
  const peak = Math.max(...values, 1);
  return (
    <div className="flex items-end" style={{ gap: 5, height: 44, marginTop: 16 }}>
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            // A day with nothing in it still gets a sliver, so seven days read
            // as seven days rather than as a gap in the record.
            height: `${Math.max((v / peak) * 100, 4)}%`,
            borderRadius: 3,
            backgroundColor: i === values.length - 1 && v > 0 ? biya.credit : "#E6E8EC",
          }}
        />
      ))}
    </div>
  );
}

function CustomerLine({ row, fx, last }: { row: ActivityRow; fx: FxSnapshot | null; last: boolean }) {
  const name = row.counterparty ?? "Payment received";
  return (
    <div className="flex items-center" style={{ gap: 12, padding: "14px 16px", borderBottom: last ? "none" : `1px solid ${biya.hairline}` }}>
      <Avatar text={initials(name)} size={38} tone={row.kind === "payment" ? "credit" : "neutral"} />
      <div className="flex-1 min-w-0">
        <div className="truncate" style={{ ...type.rowSm, color: biya.ink }}>{name}</div>
        <div className="truncate" style={{ ...type.bodySm, color: biya.faint, marginTop: 3 }}>
          {clockTime(row.createdAt)} · {row.memo || describe(row.kind)}
        </div>
      </div>
      <div className="text-right shrink-0" style={{ paddingLeft: 8 }}>
        <div style={{ ...type.rowSm, color: biya.credit }}>+₦{formatNgn(row.ngnMinor)}</div>
        {fx && (
          <div style={{ fontFamily: font.mono, fontSize: 10, color: biya.faint, marginTop: 2 }}>
            ${formatUsd(dollarValue(row.ngnMinor, fx))}
          </div>
        )}
      </div>
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

function QuietAction({ label, onClick, icon }: { label: string; onClick: () => void; icon?: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center transition-transform active:scale-[0.97]"
      style={{
        gap: 8, minHeight: icon ? 46 : 44, height: icon ? undefined : 44,
        borderRadius: 13, backgroundColor: biya.surface,
        border: `1px solid ${biya.lineStrong}`,
        fontFamily: font.sans, fontWeight: 600, fontSize: icon ? 14 : 13.5, color: biya.ink,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/** The one filled action on business home. Ink, not indigo: indigo is reserved
 *  for moving money to someone else, and this moves it to yourself. */
function SolidAction({ label, onClick, icon }: { label: string; onClick: () => void; icon?: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center transition-transform active:scale-[0.97]"
      style={{
        gap: 8, minHeight: 46, borderRadius: 13, backgroundColor: biya.ink,
        fontFamily: font.sans, fontWeight: 600, fontSize: 14, color: "#fff",
      }}
    >
      {icon}
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
  if (kind === "ngn_in") return "Bank transfer";
  if (kind === "cleva_in") return "Cleva";
  if (kind === "bank_payout") return "To your bank";
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

/** The other direction. Business takings arrive in naira and are read in both. */
function dollarValue(ngnMinor: number, fx: FxSnapshot | null): number {
  if (!fx || !fx.effectiveRate) return 0;
  return Math.round(ngnMinor / fx.effectiveRate);
}

/**
 * Money in, per day, for the last `days` days, oldest first. The last entry is
 * today. Days with no takings are zeroes rather than missing, because the
 * chart is a calendar, not a list of the days that happened to have sales.
 */
function dailyTotals(rows: ActivityRow[], days: number): number[] {
  const start = startOfToday();
  const out = new Array<number>(days).fill(0);
  for (const r of rows) {
    if (r.ngnMinor <= 0) continue;
    // 0 is today, 1 is yesterday. Anything older than the window is ignored.
    const back = Math.floor((start - startOfDay(r.createdAt)) / DAY);
    if (back < 0 || back >= days) continue;
    out[days - 1 - back] += r.ngnMinor;
  }
  return out;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
