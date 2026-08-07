import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { biya, brand, font, formatUsd, radius, type } from "./theme";
import {
  BiyaIcon, Card, Eyebrow, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusPill,
} from "./primitives";
import { AlertIcon, CheckIcon, ChevronRight, CopyIcon } from "./icons";
import { payoutRails, sortedFundingRails, type FundingRail, type RailStatus } from "../../../lib/rails";
import { getVirtualAccount } from "../../../lib/virtualAccount";
import { getOrCreateAddress } from "../../../lib/wallet";
import { nameOf, type Me } from "../../../lib/api";

const PRESETS = [2000, 5000, 10000]; // cents

export function AddMoney({ user, onBack, onFunded }: {
  user: Me;
  onBack: () => void;
  onFunded: () => void;
}) {
  const [rail, setRail] = useState<FundingRail | null>(null);

  if (rail) {
    return (
      <RailDetail
        rail={rail}
        user={user}
        onBack={() => setRail(null)}
        onExit={onBack}
        onFunded={onFunded}
      />
    );
  }

  const funding = sortedFundingRails();
  const out = payoutRails();

  return (
    <Screen>
      <ScreenHeader title="Add money" onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        <Card>
          {funding.map((r, i) => (
            <RailRow key={r.id} rail={r} last={i === funding.length - 1} onClick={() => setRail(r)} />
          ))}
        </Card>

        <div style={{ marginTop: 24 }}>
          <Eyebrow>Taking money out</Eyebrow>
          <Card style={{ marginTop: 9 }}>
            {out.map((r, i) => (
              <RailRow key={r.id} rail={r} last={i === out.length - 1} onClick={() => setRail(r)} />
            ))}
          </Card>
        </div>
      </div>
    </Screen>
  );
}

function RailRow({ rail, last, onClick }: { rail: FundingRail; last: boolean; onClick: () => void }) {
  const live = rail.isConfigured();
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center text-left transition-opacity active:opacity-70"
      style={{ gap: 12, padding: "14px 14px", borderBottom: last ? "none" : `1px solid ${biya.hairline}` }}
    >
      <span
        className="flex items-center justify-center shrink-0"
        style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: live ? biya.actionWashSoft : biya.ground }}
      >
        <span style={{ fontFamily: font.sans, fontWeight: 700, fontSize: 14, color: live ? biya.action : biya.faint }}>
          {rail.name.charAt(0)}
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate" style={{ ...type.rowSm, color: biya.ink }}>{rail.name}</span>
        <span className="block truncate" style={{ ...type.bodySm, color: biya.faint, marginTop: 2 }}>{rail.blurb}</span>
      </span>
      {live ? <ChevronRight /> : <StatusPill status="neutral">Soon</StatusPill>}
    </button>
  );
}

// ---------------------------------------------------------------------------

function RailDetail({ rail, user, onBack, onExit, onFunded }: {
  rail: FundingRail; user: Me; onBack: () => void; onExit: () => void; onFunded: () => void;
}) {
  const [amount, setAmount] = useState(PRESETS[0]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RailStatus | null>(null);

  if (!rail.isConfigured()) {
    return (
      <Screen>
        <ScreenHeader title={rail.name} onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ padding: "0 32px" }}>
          <AlertIcon size={26} color={biya.faint} />
          <p style={{ ...type.row, fontSize: 16, color: biya.ink, marginTop: 14 }}>Not available yet</p>
          <p style={{ ...type.body, color: biya.faint, marginTop: 8 }}>{rail.blurb}</p>
        </div>
        <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
          <SecondaryButton onClick={onBack}>Go back</SecondaryButton>
        </div>
      </Screen>
    );
  }

  if (result?.state === "credited") {
    return (
      <Screen>
        <ScreenHeader onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ padding: "0 32px" }}>
          <span
            className="flex items-center justify-center"
            style={{ width: 62, height: 62, borderRadius: "50%", backgroundColor: biya.creditWash }}
          >
            <CheckIcon size={28} />
          </span>
          <div style={{ ...type.balance, color: biya.ink, marginTop: 18 }}>${formatUsd(result.usdMinor)}</div>
          <p style={{ ...type.body, color: biya.muted, marginTop: 8 }}>It is in your balance now.</p>
        </div>
        <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
          {/* Done means done, not back to the rail list. */}
          <PrimaryButton onClick={() => { onFunded(); onExit(); }}>Done</PrimaryButton>
        </div>
      </Screen>
    );
  }

  // Stablecoin: a destination address.
  if (rail.id === "usdt") {
    const address = getOrCreateAddress();
    return (
      <Screen>
        <ScreenHeader title={rail.name} onBack={onBack} />
        <div className="flex-1 overflow-y-auto flex flex-col items-center" style={{ padding: "4px 20px 24px" }}>
          <div className="flex" style={{ gap: 9, alignItems: "flex-start", width: "100%" }}>
            <AlertIcon size={17} color={biya.pendingText} />
            <p style={{ ...type.body, color: biya.pendingText, flex: 1 }}>
              Send only on the network shown below. Anything sent on another network cannot be recovered.
            </p>
          </div>

          <Card style={{ marginTop: 18, width: "100%", maxWidth: 300 }}>
            <div className="flex flex-col items-center" style={{ padding: "24px 20px" }}>
              <div style={{ position: "relative", padding: 10, backgroundColor: "#fff", borderRadius: 14 }}>
                <QRCodeSVG value={address} size={172} bgColor="#ffffff" fgColor={brand.ink} level="Q" />
                <span
                  className="flex items-center justify-center"
                  style={{
                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                    width: 42, height: 42, borderRadius: 12, backgroundColor: "#fff",
                  }}
                >
                  <BiyaIcon size={28} variant="ink" />
                </span>
              </div>
              <p
                className="break-all text-center"
                style={{ fontFamily: font.mono, fontSize: 11.5, color: biya.muted, marginTop: 16, lineHeight: 1.6 }}
              >
                {address}
              </p>
            </div>
          </Card>

          <button
            onClick={async () => {
              try { await navigator.clipboard.writeText(address); toast.success("Address copied."); }
              catch { window.prompt("Copy this:", address); }
            }}
            className="flex items-center justify-center transition-transform active:scale-[0.97]"
            style={{
              gap: 7, height: 46, width: "100%", maxWidth: 300, marginTop: 14, borderRadius: 12,
              backgroundColor: biya.surface, border: `1px solid ${biya.line}`,
              fontFamily: font.sans, fontWeight: 600, fontSize: 14, color: biya.ink,
            }}
          >
            <CopyIcon /> Copy address
          </button>

          <p style={{ ...type.body, color: biya.faint, marginTop: 16, textAlign: "center", maxWidth: 300 }}>
            Dollars appear in your balance once the transfer confirms.
          </p>
        </div>
      </Screen>
    );
  }

  // Bank transfer: an account to pay into.
  if (rail.id === "bank_ngn_in") {
    const account = getVirtualAccount(user.id, nameOf(user));
    return (
      <Screen>
        <ScreenHeader title={rail.name} onBack={onBack} />
        <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
          <p style={{ ...type.body, color: biya.muted }}>
            Transfer naira to this account from any bank app. It converts to dollars at the rate when it arrives.
          </p>

          <Card style={{ marginTop: 18 }}>
            <Detail label="Bank" value={account.bankName} />
            <Detail label="Account number" value={account.accountNumber} mono />
            <Detail label="Account name" value={account.accountName} last />
          </Card>

          <button
            onClick={async () => {
              const text = `${account.bankName}\n${account.accountNumber}\n${account.accountName}`;
              try { await navigator.clipboard.writeText(text); toast.success("Account details copied."); }
              catch { window.prompt("Copy this:", text); }
            }}
            className="w-full flex items-center justify-center transition-transform active:scale-[0.97]"
            style={{
              gap: 7, height: 46, marginTop: 14, borderRadius: 12,
              backgroundColor: biya.surface, border: `1px solid ${biya.line}`,
              fontFamily: font.sans, fontWeight: 600, fontSize: 14, color: biya.ink,
            }}
          >
            <CopyIcon /> Copy details
          </button>

          <p style={{ ...type.body, color: biya.faint, marginTop: 16 }}>
            This account belongs to you and does not change.
          </p>
        </div>
      </Screen>
    );
  }

  // Everything else takes an amount.
  return (
    <Screen>
      <ScreenHeader title={rail.name} onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        <p style={{ ...type.body, color: biya.muted }}>{rail.blurb}</p>

        <div style={{ marginTop: 22 }}>
          <Eyebrow>How much</Eyebrow>
          <div className="flex" style={{ gap: 8, marginTop: 10 }}>
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                className="flex-1 transition-colors"
                style={{
                  height: 52, borderRadius: 12,
                  backgroundColor: amount === p ? biya.action : biya.surface,
                  border: `1px solid ${amount === p ? biya.action : biya.line}`,
                  fontFamily: font.sans, fontWeight: 600, fontSize: 16,
                  color: amount === p ? "#fff" : biya.ink,
                }}
              >
                ${formatUsd(p, false)}
              </button>
            ))}
          </div>
        </div>

        {result?.state === "failed" && (
          <p style={{ ...type.body, color: biya.fail, marginTop: 16 }}>{result.reason}</p>
        )}
      </div>

      <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
        <PrimaryButton
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const res = await rail.initiate(user.id, amount);
              setResult(res);
              if (res.state === "credited") onFunded();
            } catch (err) {
              setResult({ state: "failed", reason: err instanceof Error ? err.message : "That did not work." });
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Adding..." : `Add $${formatUsd(amount, false)}`}
        </PrimaryButton>
      </div>
    </Screen>
  );
}

function Detail({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ padding: "13px 15px", borderBottom: last ? "none" : `1px solid ${biya.hairline}` }}>
      <div style={{ ...type.bodySm, color: biya.faint }}>{label}</div>
      <div
        style={mono
          ? { fontFamily: font.mono, fontSize: 17, fontWeight: 700, letterSpacing: "0.08em", color: biya.ink, marginTop: 4 }
          : { ...type.row, fontSize: 15.5, color: biya.ink, marginTop: 4 }}
      >
        {value}
      </div>
    </div>
  );
}
