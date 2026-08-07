import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { biya, font, formatNgn, initials, radius, type } from "./theme";
import {
  Avatar, Card, Eyebrow, Field, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusPill,
} from "./primitives";
import { ChevronRight, PlusIcon } from "./icons";
import {
  createMandate, listMandates, resolveAccount, revokeMandate, runMandate,
  type Mandate, type Me,
} from "../../../lib/api";

// Scheduled payments.
//
// A standing authorisation with four bounds: amount per run, a per run ceiling,
// a lifetime total, and an expiry. Creating one spends a PIN once. Running it
// afterwards needs none, because that PIN already authorised exactly this.
// Cancelling is immediate, which is why Cancel is never buried here.

type View = { kind: "list" } | { kind: "create" } | { kind: "detail"; id: string };

export function Scheduled({ user, onBack }: { user: Me; onBack: () => void }) {
  const [view, setView] = useState<View>({ kind: "list" });
  const [rows, setRows] = useState<Mandate[]>([]);

  const load = useCallback(async () => setRows(await listMandates(user.id)), [user.id]);
  useEffect(() => { load(); }, [load]);

  if (view.kind === "create") {
    return <Create user={user} onBack={() => setView({ kind: "list" })} onCreated={async () => { await load(); setView({ kind: "list" }); }} />;
  }

  if (view.kind === "detail") {
    const row = rows.find((r) => r.id === view.id);
    if (!row) return null;
    return <Detail row={row} onBack={() => setView({ kind: "list" })} onChanged={load} />;
  }

  return (
    <Screen>
      <ScreenHeader title="Scheduled payments" onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        <button
          onClick={() => setView({ kind: "create" })}
          className="w-full flex items-center transition-transform active:scale-[0.99]"
          style={{
            gap: 12, padding: "14px 15px", borderRadius: radius.card,
            backgroundColor: biya.surface, border: `1px solid ${biya.line}`,
          }}
        >
          <span
            className="flex items-center justify-center"
            style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: biya.actionWashSoft }}
          >
            <PlusIcon size={18} color={biya.action} />
          </span>
          <span style={{ ...type.row, color: biya.ink }}>Set up a scheduled payment</span>
          <span className="flex-1" />
          <ChevronRight />
        </button>

        {rows.length === 0 ? (
          <Card style={{ marginTop: 16 }}>
            <div style={{ padding: "26px 20px" }}>
              <p style={{ ...type.row, fontSize: 16, color: biya.ink }}>Nothing scheduled</p>
              <p style={{ ...type.body, color: biya.faint, marginTop: 8 }}>
                A scheduled payment lets the same person be paid a set amount without you entering
                your PIN each time. You set the limit, the total and the end date, and you can cancel
                it in one tap.
              </p>
            </div>
          </Card>
        ) : (
          <div style={{ marginTop: 20 }}>
            <Eyebrow>Yours</Eyebrow>
            <Card style={{ marginTop: 9 }}>
              {rows.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setView({ kind: "detail", id: r.id })}
                  className="w-full flex items-center text-left transition-opacity active:opacity-70"
                  style={{ gap: 12, padding: "13px 14px", borderBottom: i === rows.length - 1 ? "none" : `1px solid ${biya.hairline}` }}
                >
                  <Avatar text={initials(r.payeeName)} size={38} tone={r.status === "active" ? "neutral" : "pending"} />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate" style={{ ...type.rowSm, color: biya.ink }}>{r.payeeName}</span>
                    <span className="block" style={{ ...type.bodySm, color: biya.faint, marginTop: 2 }}>
                      ₦{formatNgn(r.amountNgnMinor)} each run
                    </span>
                  </span>
                  <StatusPill status={r.status === "active" ? "completed" : r.status === "revoked" ? "failed" : "pending"}>
                    {r.status === "active" ? "Active" : r.status === "revoked" ? "Cancelled" : "Finished"}
                  </StatusPill>
                </button>
              ))}
            </Card>
          </div>
        )}
      </div>
    </Screen>
  );
}

// ---------------------------------------------------------------------------

const EXPIRY = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

function Create({ user, onBack, onCreated }: { user: Me; onBack: () => void; onCreated: () => void }) {
  const [code, setCode] = useState("");
  const [payee, setPayee] = useState<{ userId: string; name: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [total, setTotal] = useState("");
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 10) { setPayee(null); return; }
    let cancelled = false;
    resolveAccount(digits).then((r) => {
      if (cancelled) return;
      if (r.found) { setPayee({ userId: r.userId, name: r.name }); setError(null); }
      else { setPayee(null); setError(r.reason); }
    });
    return () => { cancelled = true; };
  }, [code]);

  const amountKobo = Math.round(parseFloat(amount || "0") * 100);
  const totalKobo = Math.round(parseFloat(total || "0") * 100);
  const ready = payee && amountKobo > 0 && totalKobo >= amountKobo && pin.length === 6;

  const submit = async () => {
    if (!payee || busy) return;
    setBusy(true);
    setError(null);
    try {
      const expires = new Date();
      expires.setDate(expires.getDate() + days);
      await createMandate(user.id, pin, payee.userId, amountKobo, amountKobo, totalKobo, expires, reason || undefined);
      toast.success("Scheduled payment created.");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set that up.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="New scheduled payment" onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        <Field
          label="Who gets paid"
          placeholder="Their 10 digit account number"
          value={code}
          onChange={(v) => setCode(v.replace(/\D/g, ""))}
          inputMode="numeric"
          maxLength={10}
        />

        {payee && (
          <Card style={{ marginTop: 12 }}>
            <div className="flex items-center" style={{ gap: 11, padding: "12px 14px" }}>
              <Avatar text={initials(payee.name)} size={36} tone="neutral" />
              <span style={{ ...type.rowSm, color: biya.ink }}>{payee.name}</span>
            </div>
          </Card>
        )}

        <div style={{ marginTop: 16 }}>
          <Field label="Amount each run" placeholder="1200" value={amount} onChange={(v) => setAmount(v.replace(/[^\d.]/g, ""))} inputMode="decimal" />
        </div>
        <div style={{ marginTop: 14 }}>
          <Field
            label="Total it may ever spend"
            placeholder="12000"
            value={total}
            onChange={(v) => setTotal(v.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            hint={totalKobo > 0 && totalKobo < amountKobo ? "The total has to be at least one run." : undefined}
            error={totalKobo > 0 && totalKobo < amountKobo}
          />
        </div>

        <div style={{ marginTop: 18 }}>
          <Eyebrow>Ends after</Eyebrow>
          <div className="flex" style={{ gap: 8, marginTop: 9 }}>
            {EXPIRY.map((e) => (
              <button
                key={e.days}
                onClick={() => setDays(e.days)}
                className="flex-1 transition-colors"
                style={{
                  height: 42, borderRadius: 11,
                  backgroundColor: days === e.days ? biya.action : biya.surface,
                  border: `1px solid ${days === e.days ? biya.action : biya.line}`,
                  fontFamily: font.sans, fontWeight: 600, fontSize: 13.5,
                  color: days === e.days ? "#fff" : biya.ink,
                }}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <Field label="What it is for, optional" placeholder="Weekly rice" value={reason} onChange={setReason} maxLength={40} />
        </div>

        <div style={{ marginTop: 18 }}>
          <Field
            label="Your PIN"
            placeholder="......"
            value={pin}
            onChange={(v) => setPin(v.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            type="password"
            maxLength={6}
            hint="Entered once. Runs after this do not ask again, and you can cancel any time."
            error={!!error}
          />
        </div>

        {error && <p style={{ ...type.body, color: biya.fail, marginTop: 10 }}>{error}</p>}
      </div>

      <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
        <PrimaryButton onClick={submit} disabled={!ready || busy}>
          {busy ? "Setting up..." : "Set it up"}
        </PrimaryButton>
      </div>
    </Screen>
  );
}

// ---------------------------------------------------------------------------

function Detail({ row, onBack, onChanged }: { row: Mandate; onBack: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const remaining = row.maxTotalNgnMinor - row.spentTotalNgnMinor;
  const pct = row.maxTotalNgnMinor ? Math.min(100, (row.spentTotalNgnMinor / row.maxTotalNgnMinor) * 100) : 0;

  const run = async () => {
    setBusy(true);
    try {
      const res = await runMandate(row.id);
      if (res.ok) toast.success(`₦${formatNgn(res.ngnMinor)} sent to ${row.payeeName}.`);
      else toast.error(res.reason);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not run that.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await revokeMandate(row.id);
      toast.success("Cancelled. Nothing more will be sent.");
      onChanged();
      onBack();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel that.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title={row.payeeName} onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        <div className="flex items-center" style={{ gap: 10 }}>
          <StatusPill status={row.status === "active" ? "completed" : row.status === "revoked" ? "failed" : "pending"}>
            {row.status === "active" ? "Active" : row.status === "revoked" ? "Cancelled" : "Finished"}
          </StatusPill>
          {row.reason && <span style={{ ...type.body, color: biya.faint }}>{row.reason}</span>}
        </div>

        <div style={{ ...type.balance, color: biya.ink, marginTop: 18 }}>₦{formatNgn(row.amountNgnMinor)}</div>
        <div style={{ ...type.body, color: biya.muted, marginTop: 6 }}>each time it runs</div>

        {/* All four bounds stay visible. The bounded and cancellable property is
            the entire argument, so it is not hidden behind a disclosure. */}
        <Card style={{ marginTop: 22 }}>
          <Bound label="Most per run" value={`₦${formatNgn(row.maxPerRunNgnMinor)}`} />
          <Bound label="Total it may ever spend" value={`₦${formatNgn(row.maxTotalNgnMinor)}`} />
          <Bound label="Spent so far" value={`₦${formatNgn(row.spentTotalNgnMinor)}`} />
          <Bound label="Left" value={`₦${formatNgn(Math.max(0, remaining))}`} />
          <Bound label="Ends" value={new Date(row.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} last />
        </Card>

        <div style={{ marginTop: 16 }}>
          <div style={{ height: 6, borderRadius: 3, backgroundColor: biya.ground, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", backgroundColor: biya.action, borderRadius: 3 }} />
          </div>
        </div>

        {row.status === "active" && (
          <div style={{ marginTop: 26 }}>
            <Eyebrow>Demo control. A real schedule runs this automatically.</Eyebrow>
            <div style={{ marginTop: 10 }}>
              <SecondaryButton onClick={run} disabled={busy}>Run now</SecondaryButton>
            </div>
          </div>
        )}
      </div>

      {row.status === "active" && (
        <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
          <button
            onClick={cancel}
            disabled={busy}
            className="w-full transition-transform active:scale-[0.99] disabled:opacity-50"
            style={{
              height: 52, borderRadius: radius.control, backgroundColor: biya.failWash,
              fontFamily: font.sans, fontWeight: 600, fontSize: 16, color: biya.fail,
            }}
          >
            Cancel this scheduled payment
          </button>
        </div>
      )}
    </Screen>
  );
}

function Bound({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "12px 15px", borderBottom: last ? "none" : `1px solid ${biya.hairline}` }}
    >
      <span style={{ ...type.body, color: biya.muted }}>{label}</span>
      <span style={{ ...type.rowSm, color: biya.ink }}>{value}</span>
    </div>
  );
}
