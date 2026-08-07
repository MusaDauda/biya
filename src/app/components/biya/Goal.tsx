import { useState } from "react";
import { toast } from "sonner";
import { biya, font, formatNgn, formatUsd, type } from "./theme";
import { Card, Eyebrow, Field, PrimaryButton, Screen, ScreenHeader, SecondaryButton } from "./primitives";
import { createGoal, releaseGoalFunds, setAutosave, type Goal as GoalT, type Me } from "../../../lib/api";

// Savings. The target is named in naira because that is how a person thinks
// about what they are buying. The balance is held in dollars because that is
// what keeps its value between now and then.

const PERCENTAGES = [10, 20, 30, 50];

export function Goal({ user, goal, onBack, onChanged }: {
  user: Me;
  goal: GoalT | null;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      await createGoal(user.id, name.trim(), Math.round(parseFloat(target || "0") * 100));
      toast.success("Goal created.");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create that goal.");
    } finally {
      setBusy(false);
    }
  };

  const setPct = async (pct: number) => {
    setBusy(true);
    try {
      await setAutosave(user.id, user.autosave_pct === pct ? 0 : pct);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change that.");
    } finally {
      setBusy(false);
    }
  };

  const release = async () => {
    if (!goal || goal.savedUsdMinor <= 0) return;
    setBusy(true);
    try {
      await releaseGoalFunds(goal.id, goal.savedUsdMinor);
      toast.success("Moved back to your spendable balance.");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not move that money.");
    } finally {
      setBusy(false);
    }
  };

  if (!goal) {
    return (
      <Screen>
        <ScreenHeader title="Savings" onBack={onBack} />
        <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
          <div style={{ ...type.title, color: biya.ink }}>What are you saving for?</div>
          <p style={{ ...type.body, color: biya.muted, marginTop: 8 }}>
            Name it and set the naira price. A slice of every payment you receive moves here
            automatically, and you can take it back whenever you want.
          </p>

          <div style={{ marginTop: 22 }}>
            <Field label="What it is" placeholder="Chest freezer" value={name} onChange={setName} maxLength={40} />
          </div>
          <div style={{ marginTop: 14 }}>
            <Field
              label="What it costs, in naira"
              placeholder="180000"
              value={target}
              onChange={(v) => setTarget(v.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
            />
          </div>
        </div>

        <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
          <PrimaryButton onClick={create} disabled={busy || !name.trim() || !(parseFloat(target || "0") > 0)}>
            Create goal
          </PrimaryButton>
        </div>
      </Screen>
    );
  }

  const targetUsdish = goal.targetNgnMinor;
  const pct = targetUsdish > 0 ? Math.min(100, (goal.savedUsdMinor * 100) / Math.max(1, targetUsdish) * 100) : 0;

  return (
    <Screen>
      <ScreenHeader title={goal.name} onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        <Eyebrow>Saved so far</Eyebrow>
        <div style={{ ...type.balance, color: biya.ink, marginTop: 10 }}>${formatUsd(goal.savedUsdMinor)}</div>
        <div style={{ ...type.body, color: biya.muted, marginTop: 8 }}>
          towards ₦{formatNgn(goal.targetNgnMinor)}
        </div>

        <div style={{ marginTop: 18, height: 6, borderRadius: 3, backgroundColor: biya.surface, overflow: "hidden", border: `1px solid ${biya.line}` }}>
          <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", backgroundColor: biya.credit }} />
        </div>

        <div style={{ marginTop: 22 }}>
          <PrimaryButton onClick={release} disabled={busy || goal.savedUsdMinor <= 0}>
            Move to spendable
          </PrimaryButton>
          <p style={{ ...type.body, color: biya.faint, marginTop: 10, textAlign: "center" }}>
            Never locked. Move it whenever you want.
          </p>
        </div>

        <div style={{ marginTop: 30 }}>
          <Eyebrow>Save this much of every payment</Eyebrow>
          <div className="flex" style={{ gap: 8, marginTop: 10 }}>
            {PERCENTAGES.map((p) => {
              const on = user.autosave_pct === p;
              return (
                <button
                  key={p}
                  onClick={() => setPct(p)}
                  disabled={busy}
                  className="flex-1 transition-colors disabled:opacity-50"
                  style={{
                    height: 44, borderRadius: 12,
                    backgroundColor: on ? biya.action : biya.surface,
                    border: `1px solid ${on ? biya.action : biya.line}`,
                    fontFamily: font.sans, fontWeight: 600, fontSize: 14,
                    color: on ? "#fff" : biya.ink,
                  }}
                >
                  {p}%
                </button>
              );
            })}
          </div>
          <p style={{ ...type.body, color: biya.faint, marginTop: 10 }}>
            {user.autosave_pct > 0
              ? `${user.autosave_pct}% of every payment you receive moves here, converted at the mid rate. Tap it again to turn it off.`
              : "Pick one and it starts on your next payment. Tap it again to turn it off."}
          </p>
        </div>
      </div>
    </Screen>
  );
}
