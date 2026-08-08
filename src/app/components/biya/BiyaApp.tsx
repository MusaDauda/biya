import { useCallback, useEffect, useMemo, useState } from "react";
import { biya, font } from "./theme";
import { BottomNav, type TabKey } from "./BottomNav";
import { Home, ContextSwitchSheet, type Context } from "./Home";
import { Activity } from "./Activity";
import { Profile } from "./Profile";
import { Pay } from "./Pay";
import { PayFlow } from "./PayFlow";
import { Assistant } from "./Assistant";
import { Goal } from "./Goal";
import { AddMoney } from "./AddMoney";
import { Scheduled } from "./Scheduled";
import { BiyaIcon } from "./primitives";
import {
  getBalances, getCurrentFx, getGoal, getMe, listActivity, listBusinessAccounts,
  setStoredContext, storedContext,
  type ActivityRow, type Balances, type BusinessAccount, type FxSnapshot,
  type Goal as GoalT, type Me,
} from "../../../lib/api";

// One app, one nav. Business is a context, not a second tree.
type Overlay =
  | { kind: "none" }
  | { kind: "pay"; mode?: "scan" | "transfer" | "receive" }
  | { kind: "flow"; payee: Me; ngnMinor: number; note?: string; proposalId?: string }
  | { kind: "add" }
  | { kind: "goal" }
  | { kind: "scheduled" };

export function BiyaApp({ user, onUserChanged, onLogout }: {
  user: Me;
  onUserChanged: (u: Me) => void;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<TabKey>("home");
  const [overlay, setOverlay] = useState<Overlay>({ kind: "none" });
  const [switching, setSwitching] = useState(false);

  const [balances, setBalances] = useState<Balances>({ usdMinor: 0, ngnMinor: 0, savedUsdMinor: 0 });
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [goal, setGoal] = useState<GoalT | null>(null);
  const [fx, setFx] = useState<FxSnapshot | null>(null);
  const [businesses, setBusinesses] = useState<BusinessAccount[]>([]);
  const [contextId, setContextId] = useState(storedContext());
  const [loaded, setLoaded] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  const refresh = useCallback(async () => {
    const [b, a, g, f, biz] = await Promise.all([
      getBalances(user.id),
      listActivity(user.id),
      getGoal(user.id),
      getCurrentFx(),
      listBusinessAccounts(user.id),
    ]);
    setBalances(b);
    setActivity(a);
    setGoal(g);
    setFx(f);
    setBusinesses(biz);
    setLoaded(true);
  }, [user.id]);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 5000);
    return () => clearInterval(iv);
  }, [refresh]);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  const context: Context = useMemo(() => {
    const found = businesses.find((b) => b.id === contextId);
    return found ? { kind: "business", account: found } : { kind: "personal" };
  }, [businesses, contextId]);

  const pickContext = (id: string) => {
    if (id === "open") { setSwitching(true); return; }
    setContextId(id);
    setStoredContext(id);
    setSwitching(false);
  };

  const close = () => setOverlay({ kind: "none" });

  // ---- overlays -----------------------------------------------------------

  if (overlay.kind === "pay") {
    return (
      <Pay
        user={user}
        fx={fx}
        recents={activity}
        mode={overlay.mode}
        receiveAs={context.kind === "business"
          ? { name: context.account.name, tag: context.account.tag, receiveCode: context.account.receiveCode }
          : undefined}
        onClose={close}
        onContinue={(payee, ngnMinor, note) => setOverlay({ kind: "flow", payee, ngnMinor, note })}
      />
    );
  }

  if (overlay.kind === "flow") {
    return (
      <PayFlow
        payer={user}
        payee={overlay.payee}
        ngnMinor={overlay.ngnMinor}
        note={overlay.note}
        proposalId={overlay.proposalId}
        balances={balances}
        fx={fx}
        onClose={close}
        onDone={() => { close(); setTab("home"); refresh(); }}
      />
    );
  }

  if (overlay.kind === "add") {
    return <AddMoney user={user} onBack={close} onFunded={refresh} />;
  }

  if (overlay.kind === "goal") {
    return (
      <Goal
        user={user}
        goal={goal}
        onBack={close}
        onChanged={async () => {
          await refresh();
          const fresh = await getMe(user.id);
          if (fresh) onUserChanged(fresh);
        }}
      />
    );
  }

  if (overlay.kind === "scheduled") {
    return <Scheduled user={user} onBack={close} />;
  }

  if (!loaded) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ backgroundColor: biya.ground, gap: 14 }}>
        <BiyaIcon size={34} variant="indigo" />
        <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: biya.faint }}>
          Loading
        </span>
      </div>
    );
  }

  // ---- tabs ---------------------------------------------------------------

  return (
    <div className="h-full relative overflow-hidden" style={{ backgroundColor: biya.ground }}>
      {tab === "home" && (
        <Home
          user={user}
          balances={balances}
          activity={activity}
          fx={fx}
          context={context}
          businesses={businesses}
          offline={!online}
          onSwitch={pickContext}
          onAddBusiness={() => { setSwitching(false); setTab("profile"); }}
          onRequest={() => setOverlay({ kind: "pay", mode: "receive" })}
          onAddMoney={() => setOverlay({ kind: "add" })}
          onWithdraw={() => setOverlay({ kind: "add" })}
          onGoal={() => setOverlay({ kind: "goal" })}
          onViewAll={() => setTab("activity")}
          onRetry={refresh}
        />
      )}

      {tab === "activity" && <Activity rows={activity} />}

      {/* Kept mounted rather than switched on and off. The transcript is saved
          either way, but a reply that lands while the user is on another tab
          should still arrive, and their half typed question should still be
          there. `contents` keeps the layout identical to rendering it bare. */}
      <div style={{ display: tab === "chat" ? "contents" : "none" }}>
        <Assistant
          user={user}
          active={tab === "chat"}
          onConfirm={async (proposal) => {
            const payee = await getMe(proposal.payeeId);
            if (!payee) return;
            setOverlay({ kind: "flow", payee, ngnMinor: proposal.ngnMinor, proposalId: proposal.proposalId });
          }}
        />
      </div>

      {tab === "profile" && (
        <Profile
          user={user}
          balances={balances}
          businesses={businesses}
          onRefresh={refresh}
          onLogout={onLogout}
          onUserChanged={onUserChanged}
          onScheduled={() => setOverlay({ kind: "scheduled" })}
          onGoal={() => setOverlay({ kind: "goal" })}
          onAddMoney={() => setOverlay({ kind: "add" })}
        />
      )}

      {/* Mounted and unmounted directly. An exit animation would gate the
          dismissal on requestAnimationFrame, which is throttled whenever the
          screen is off or the tab is in the background. */}
      {switching && (
        <ContextSwitchSheet
          user={user}
          balances={balances}
          businesses={businesses}
          current={contextId}
          onPick={pickContext}
          onAddBusiness={() => { setSwitching(false); setTab("profile"); }}
          onDismiss={() => setSwitching(false)}
        />
      )}

      <BottomNav
        active={tab}
        onChange={setTab}
        onCentre={() => setOverlay({ kind: "pay", mode: context.kind === "business" ? "receive" : "scan" })}
        business={context.kind === "business"}
        offline={!online}
      />
    </div>
  );
}
