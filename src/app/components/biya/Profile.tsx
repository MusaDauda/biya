import { useEffect, useState } from "react";
import { toast } from "sonner";
import { biya, font, formatUsd, initials, radius, relativeTime, type } from "./theme";
import { Avatar, Card, Eyebrow, PrimaryButton, StatusPill } from "./primitives";
import { ChevronRight } from "./icons";
import {
  createBusinessAccount, listAgentActions, personName,
  type AgentAction, type Balances, type BusinessAccount, type Me,
} from "../../../lib/api";

export function Profile({
  user, balances, businesses, onRefresh, onLogout, onUserChanged, onScheduled, onGoal, onAddMoney,
}: {
  user: Me;
  balances: Balances;
  businesses: BusinessAccount[];
  onRefresh: () => void;
  onLogout: () => void;
  onUserChanged: (u: Me) => void;
  onScheduled: () => void;
  onGoal: () => void;
  onAddMoney: () => void;
}) {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [adding, setAdding] = useState(false);
  const [bizName, setBizName] = useState("");

  useEffect(() => { listAgentActions(user.id).then(setActions).catch(() => {}); }, [user.id]);

  const addBusiness = async () => {
    if (!bizName.trim()) return;
    try {
      await createBusinessAccount(user.id, bizName.trim());
      toast.success("Business added. Switch to it from the top of Home.");
      setBizName("");
      setAdding(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add that business.");
    }
  };

  const visible = showAll ? actions : actions.slice(0, 4);

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: biya.ground, paddingBottom: 132 }}>
      <header
        className="flex items-center"
        style={{ gap: 13, padding: "0 20px 18px", paddingTop: "calc(22px + var(--safe-top, 0px))" }}
      >
        <Avatar text={initials(personName(user))} size={52} tone="ink" rounded={999} />
        <div className="min-w-0">
          <div className="truncate" style={{ ...type.title, fontSize: 20, color: biya.ink }}>{personName(user)}</div>
          <div className="truncate" style={{ ...type.body, color: biya.faint, marginTop: 2 }}>
            {user.tag ? `@${user.tag}` : user.email}
          </div>
        </div>
      </header>

      <div style={{ padding: "0 20px" }}>
        <Card>
          <div style={{ padding: "16px 16px 14px" }}>
            <div className="flex items-center justify-between">
              <Eyebrow>Your dollars</Eyebrow>
              <StatusPill status="tier">Tier {user.kyc_tier}</StatusPill>
            </div>
            <div style={{ ...type.balance, fontSize: 34, color: biya.ink, marginTop: 9 }}>
              ${formatUsd(balances.usdMinor)}
            </div>
            {balances.savedUsdMinor > 0 && (
              <div style={{ ...type.body, color: biya.muted, marginTop: 6 }}>
                ${formatUsd(balances.savedUsdMinor)} saved towards a goal
              </div>
            )}
          </div>
        </Card>

        <div style={{ marginTop: 20 }}>
          <Eyebrow>Money</Eyebrow>
          <Card style={{ marginTop: 9 }}>
            <Row label="Add money" onClick={onAddMoney} />
            <Row label="Savings goal" onClick={onGoal} />
            <Row label="Scheduled payments" onClick={onScheduled} last />
          </Card>
        </div>

        <div style={{ marginTop: 20 }}>
          <Eyebrow>Business</Eyebrow>
          <Card style={{ marginTop: 9 }}>
            {businesses.map((b) => (
              <div key={b.id} className="flex items-center" style={{ gap: 12, padding: "13px 14px", borderBottom: `1px solid ${biya.hairline}` }}>
                <Avatar text={initials(b.name)} size={34} tone="neutral" />
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ ...type.rowSm, color: biya.ink }}>{b.name}</div>
                  <div style={{ fontFamily: font.mono, fontSize: 11, color: biya.faint, marginTop: 2 }}>{b.receiveCode}</div>
                </div>
              </div>
            ))}

            {adding ? (
              <div style={{ padding: "13px 14px" }}>
                <input
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="Trading name"
                  autoFocus
                  className="w-full outline-none"
                  style={{ height: 44, borderRadius: 11, backgroundColor: biya.ground, padding: "0 12px", ...type.body, fontSize: 14.5, color: biya.ink }}
                />
                <div className="flex" style={{ gap: 8, marginTop: 10 }}>
                  <PrimaryButton height={42} onClick={addBusiness} disabled={!bizName.trim()}>Add</PrimaryButton>
                  <button
                    onClick={() => { setAdding(false); setBizName(""); }}
                    style={{ height: 42, padding: "0 16px", borderRadius: 12, border: `1px solid ${biya.lineStrong}`, fontFamily: font.sans, fontWeight: 600, fontSize: 14, color: biya.ink }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <Row label={businesses.length ? "Add another business" : "Sell something? Add a business"} onClick={() => setAdding(true)} last />
            )}
          </Card>
        </div>

        {actions.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <Eyebrow>What the assistant did</Eyebrow>
            <Card style={{ marginTop: 9 }}>
              {visible.map((a, i) => (
                <div
                  key={a.id}
                  className="flex items-center"
                  style={{ gap: 10, padding: "11px 14px", borderBottom: i === visible.length - 1 ? "none" : `1px solid ${biya.hairline}` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate" style={{ fontFamily: font.mono, fontSize: 12, color: biya.ink }}>{a.tool}</div>
                    <div style={{ ...type.bodySm, color: biya.faint, marginTop: 2 }}>
                      {relativeTime(a.createdAt)}{a.error ? " · refused" : ""}
                    </div>
                  </div>
                  <AuthorityTag value={a.authorizedBy} refused={!!a.error} />
                </div>
              ))}
              {actions.length > 4 && (
                <button
                  onClick={() => setShowAll((s) => !s)}
                  className="w-full"
                  style={{ padding: "11px 14px", borderTop: `1px solid ${biya.hairline}`, fontFamily: font.sans, fontWeight: 600, fontSize: 13, color: biya.action }}
                >
                  {showAll ? "Show less" : `Show all ${actions.length}`}
                </button>
              )}
            </Card>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <Eyebrow>Account</Eyebrow>
          <Card style={{ marginTop: 9 }}>
            <Row label="Security" onClick={() => toast("Security settings are coming.")} />
            <Row label="Notifications" onClick={() => toast("Notification settings are coming.")} />
            <Row label="Help" onClick={() => toast("Support is coming.")} last />
          </Card>
        </div>

        <button
          onClick={onLogout}
          className="w-full transition-transform active:scale-[0.99]"
          style={{
            marginTop: 20, height: 50, borderRadius: radius.control,
            backgroundColor: biya.surface, border: `1px solid ${biya.line}`,
            fontFamily: font.sans, fontWeight: 600, fontSize: 15, color: biya.fail,
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function Row({ label, onClick, last }: { label: string; onClick: () => void; last?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center text-left transition-opacity active:opacity-70"
      style={{ gap: 10, padding: "14px 14px", borderBottom: last ? "none" : `1px solid ${biya.hairline}` }}
    >
      <span className="flex-1" style={{ ...type.rowSm, color: biya.ink }}>{label}</span>
      <ChevronRight />
    </button>
  );
}

/**
 * Reading, proposing and spending must not look alike. Read is quiet, a PIN
 * confirmation is indigo, and a scheduled run is clay because that is money
 * that moved without anyone being asked at the time.
 */
function AuthorityTag({ value, refused }: { value: string; refused: boolean }) {
  if (refused) return <StatusPill status="failed">Refused</StatusPill>;
  if (value.startsWith("mandate")) return <StatusPill status="pending">Scheduled</StatusPill>;
  if (value === "user_pin") return <StatusPill status="tier">Your PIN</StatusPill>;
  return <StatusPill status="neutral">Read</StatusPill>;
}
