import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { biya, font, formatUsd, radius, type } from "./theme";
import {
  Card, Eyebrow, Field, PrimaryButton, Screen, ScreenHeader, SecondaryButton, Segmented,
  StatusPill, TextButton,
} from "./primitives";
import { CheckIcon } from "./icons";
import {
  claimTag, completeSelfie, createBusinessAccount, getTierLimits, onboardingStep,
  requestEmailCode, saveAddress, saveLegalName, setTransactionPin, submitIdentity,
  suggestTag, verifyEmailCode,
  type Me, type TierLimits,
} from "../../../lib/api";

// A4 to A10.
//
// Five steps, then the tier summary, then the business question. Nigerian law
// requires the identity check before an account can hold or move money, so the
// screens say that plainly rather than apologising for it.

// Mirrors OnboardingStep minus "done", so the router below can be exhaustive
// and a new step can never be silently unhandled.
type Step = "verify_email" | "name" | "phone" | "identity" | "address" | "pin" | "tier" | "business" | "trading";

const STEP_INDEX: Record<string, number> = { name: 1, phone: 2, identity: 3, address: 4, pin: 5 };

const STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export function Onboarding({ user, onUser, onFinish }: {
  user: Me;
  /** Intermediate saves, so the rest of the app sees the latest record. */
  onUser: (u: Me) => void;
  /** The flow is over. Only the last two screens call this. */
  onFinish: (u: Me) => void;
}) {
  const [me, setMe] = useState(user);
  const [step, setStep] = useState<Step>(() => resume(user));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const advance = (next: Step, updated?: Me) => {
    if (updated) { setMe(updated); onUser(updated); }
    setError(null);
    setStep(next);
  };

  const guard = async (fn: () => Promise<Me>, next: Step) => {
    setBusy(true);
    setError(null);
    try {
      advance(next, await fn());
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  };

  const common = { me, busy, error, guard, advance };

  // Exhaustive on purpose. This used to end in a bare `return <BusinessStep/>`,
  // so any step the ladder did not name fell through to the business question,
  // and an account whose email was still unverified landed on "Do you sell
  // anything?" on every launch.
  switch (step) {
    case "verify_email": return <VerifyStep {...common} />;
    case "name": return <NameStep {...common} />;
    case "phone": return <PhoneStep {...common} />;
    case "identity": return <IdentityStep {...common} />;
    case "address": return <AddressStep {...common} />;
    case "pin": return <PinStep {...common} />;
    case "tier": return <TierStep me={me} onNext={() => setStep("business")} />;
    case "business": return <BusinessStep {...common} onFinish={onFinish} />;
    case "trading": return <TradingStep {...common} onFinish={onFinish} />;
  }
}

/**
 * Where a part finished account picks up. A finished one goes to the tier
 * summary rather than anywhere that could look like a fresh signup.
 */
function resume(user: Me): Step {
  const s = onboardingStep(user);
  return s === "done" ? "tier" : s;
}

type StepProps = {
  me: Me;
  busy: boolean;
  error: string | null;
  guard: (fn: () => Promise<Me>, next: Step) => Promise<void>;
  advance: (next: Step, updated?: Me) => void;
};

function Frame({
  step, title, blurb, children, action, secondary, disabled, busy, error,
  onAction, onSecondary, onSkip,
}: {
  step?: Step; title: string; blurb?: string; children?: ReactNode;
  action: string; secondary?: string; disabled?: boolean; busy?: boolean; error?: string | null;
  onAction: () => void; onSecondary?: () => void; onSkip?: () => void;
}) {
  return (
    <Screen>
      <ScreenHeader right={onSkip ? <TextButton onClick={onSkip}>Finish later</TextButton> : undefined} />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        {step && STEP_INDEX[step] && (
          <div style={{ marginBottom: 14 }}>
            <Eyebrow>Step {STEP_INDEX[step]} of 5</Eyebrow>
            <div className="flex" style={{ gap: 5, marginTop: 8 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  style={{
                    flex: 1, height: 3, borderRadius: 2,
                    backgroundColor: n <= STEP_INDEX[step] ? biya.action : biya.lineStrong,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div style={{ ...type.title, fontSize: 26, color: biya.ink }}>{title}</div>
        {blurb && <p style={{ ...type.body, color: biya.muted, marginTop: 10 }}>{blurb}</p>}

        <div style={{ marginTop: 24 }}>{children}</div>

        {error && <p style={{ ...type.body, color: biya.fail, marginTop: 16 }}>{error}</p>}
      </div>

      <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
        <PrimaryButton onClick={onAction} disabled={disabled || busy}>
          {busy ? "One moment..." : action}
        </PrimaryButton>
        {secondary && onSecondary && (
          <div className="text-center" style={{ marginTop: 14 }}>
            <TextButton onClick={onSecondary}>{secondary}</TextButton>
          </div>
        )}
      </div>
    </Screen>
  );
}

// --- A3, reached only when a session resumes before the email was confirmed ---

function VerifyStep({ me, busy, error, guard }: StepProps) {
  const [code, setCode] = useState("");
  const [issued, setIssued] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      setIssued(await requestEmailCode(me.id));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => { send(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <Frame
      title="Confirm your email"
      blurb={`We sent six digits to ${me.email}. It expires in 10 minutes.`}
      action="Verify"
      busy={busy || sending}
      error={error}
      disabled={code.length !== 6}
      onAction={() => guard(() => verifyEmailCode(me.id, code), "name")}
    >
      <Field
        label="Six digit code"
        value={code}
        onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        maxLength={6}
        autoFocus
      />

      {/* No mail transport is wired, so the code it issued is offered here
          rather than pretending an email is on its way. */}
      {issued && (
        <button
          onClick={() => { setCode(issued); guard(() => verifyEmailCode(me.id, issued), "name"); }}
          className="w-full"
          style={{
            marginTop: 16, padding: "12px 14px", borderRadius: 12,
            backgroundColor: biya.actionWashSoft,
            fontFamily: font.mono, fontSize: 12.5, color: biya.action,
          }}
        >
          Tap to fill {issued}
        </button>
      )}
    </Frame>
  );
}

// --- A4 ---------------------------------------------------------------------

function NameStep({ me, busy, error, guard }: StepProps) {
  const [first, setFirst] = useState(me.first_name ?? "");
  const [last, setLast] = useState(me.last_name ?? "");
  const [dob, setDob] = useState(me.date_of_birth ?? "");

  return (
    <Frame
      step="name"
      title="Your legal name"
      blurb="It has to match your NIN or BVN record exactly, otherwise the check fails later."
      action="Continue"
      busy={busy}
      error={error}
      disabled={!first.trim() || !last.trim() || !dob}
      onAction={() => guard(() => saveLegalName(me.id, first, last, dob), "phone")}
    >
      <Field label="First name" value={first} onChange={setFirst} placeholder="Hauwa" autoFocus />
      <div style={{ height: 14 }} />
      <Field label="Last name" value={last} onChange={setLast} placeholder="Abdullahi" />
      <div style={{ height: 14 }} />
      <label className="block">
        <span style={{ display: "block", fontFamily: font.sans, fontWeight: 500, fontSize: 12, color: biya.muted, marginBottom: 7 }}>
          Date of birth
        </span>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          max={new Date(Date.now() - 16 * 365 * 86400000).toISOString().slice(0, 10)}
          className="w-full outline-none"
          style={{
            height: 52, borderRadius: radius.control, backgroundColor: biya.ground,
            padding: "0 14px", fontFamily: font.sans, fontWeight: 500, fontSize: 15, color: biya.ink,
          }}
        />
      </label>
    </Frame>
  );
}

// --- A5 ---------------------------------------------------------------------

function PhoneStep({ me, busy, error, guard }: StepProps) {
  const [phone, setPhone] = useState("");
  const [tag, setTag] = useState(() => suggestTag(me.first_name ?? "biya"));
  const [editing, setEditing] = useState(false);

  return (
    <Frame
      step="phone"
      title="Your phone number"
      blurb="This becomes your Biya tag, so people can pay you without knowing your account number."
      action="Continue"
      busy={busy}
      error={error}
      disabled={phone.replace(/\D/g, "").length < 10 || tag.length < 3}
      onAction={() => guard(() => claimTag(me.id, phone, tag), "identity")}
    >
      <Field
        label="Phone number"
        value={phone}
        onChange={setPhone}
        placeholder="0803 412 7788"
        inputMode="tel"
        maxLength={14}
        autoFocus
        hint="We never share this number with people you pay."
      />

      <Card style={{ marginTop: 18 }}>
        <div className="flex items-center justify-between" style={{ padding: "14px 15px" }}>
          <div className="min-w-0">
            <div style={{ ...type.bodySm, color: biya.faint }}>Your tag will be</div>
            {editing ? (
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                autoFocus
                maxLength={20}
                className="outline-none bg-transparent"
                style={{ fontFamily: font.mono, fontSize: 16, fontWeight: 700, color: biya.ink, marginTop: 4, width: "100%" }}
              />
            ) : (
              <div style={{ fontFamily: font.mono, fontSize: 16, fontWeight: 700, color: biya.ink, marginTop: 4 }}>
                @{tag}
              </div>
            )}
          </div>
          <TextButton color={biya.action} onClick={() => setEditing((e) => !e)}>
            {editing ? "Done" : "Change"}
          </TextButton>
        </div>
      </Card>
    </Frame>
  );
}

// --- A6 ---------------------------------------------------------------------

function IdentityStep({ me, busy, error, guard }: StepProps) {
  const [kind, setKind] = useState<"nin" | "bvn">("nin");
  const [value, setValue] = useState("");

  return (
    <Frame
      step="identity"
      title="Confirm who you are"
      blurb="Nigerian law requires this before an account can hold or move money. Either number works."
      action="Verify identity"
      busy={busy}
      error={error}
      disabled={value.replace(/\D/g, "").length !== 11}
      onAction={() => guard(() => submitIdentity(me.id, kind, value), "address")}
    >
      <Segmented
        value={kind}
        onChange={(k) => setKind(k as "nin" | "bvn")}
        options={[{ key: "nin", label: "NIN" }, { key: "bvn", label: "BVN" }]}
      />
      <div style={{ height: 16 }} />
      <Field
        label={kind === "nin" ? "NIN" : "BVN"}
        value={value}
        onChange={(v) => setValue(v.replace(/\D/g, "").slice(0, 11))}
        placeholder="1234 5678 901"
        inputMode="numeric"
        maxLength={11}
        autoFocus
      />

      <Card style={{ marginTop: 20 }}>
        <div style={{ padding: "14px 15px" }}>
          <Eyebrow>What happens to it</Eyebrow>
          {[
            "We check your name and date of birth against the record, once.",
            "Only the last four digits are kept on your profile.",
            "We cannot see your bank balances, and we never share this with anyone you pay.",
          ].map((line) => (
            <div key={line} className="flex" style={{ gap: 9, marginTop: 10, alignItems: "flex-start" }}>
              <span style={{ marginTop: 3 }}><CheckIcon size={13} weight={3} /></span>
              <span style={{ ...type.body, color: biya.muted, flex: 1 }}>{line}</span>
            </div>
          ))}
        </div>
      </Card>
    </Frame>
  );
}

// --- A7 ---------------------------------------------------------------------

function AddressStep({ me, busy, error, guard, advance }: StepProps) {
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const save = async (thenSelfie: boolean) => {
    await guard(async () => {
      const saved = await saveAddress(me.id, street, city, state);
      return thenSelfie ? await completeSelfie(me.id) : saved;
    }, "pin");
  };

  return (
    <Frame
      step="address"
      title="Where you live"
      blurb="Your residential address, not a PO box. Nothing is posted to you."
      action="Take a selfie now"
      secondary="Skip for now"
      busy={busy}
      error={error}
      disabled={!street.trim() || !state}
      onAction={() => save(true)}
      onSecondary={() => save(false)}
    >
      <Field label="Street address" value={street} onChange={setStreet} placeholder="12 Ahmadu Bello Way" autoFocus />
      <div style={{ height: 14 }} />
      <Field label="City" value={city} onChange={setCity} placeholder="Kaduna" />
      <div style={{ height: 14 }} />
      <label className="block">
        <span style={{ display: "block", fontFamily: font.sans, fontWeight: 500, fontSize: 12, color: biya.muted, marginBottom: 7 }}>
          State
        </span>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full outline-none"
          style={{
            height: 52, borderRadius: radius.control, backgroundColor: biya.ground,
            padding: "0 12px", fontFamily: font.sans, fontWeight: 500, fontSize: 15,
            color: state ? biya.ink : biya.faint,
          }}
        >
          <option value="">Choose a state</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <Card style={{ marginTop: 20 }}>
        <div style={{ padding: "14px 15px" }}>
          <div className="flex items-center justify-between">
            <span style={{ ...type.rowSm, color: biya.ink }}>A selfie unlocks Tier 2</span>
            <StatusPill status="tier">Optional</StatusPill>
          </div>
          <p style={{ ...type.body, color: biya.muted, marginTop: 7 }}>
            You can add it later from Settings when you need the higher limits.
          </p>
        </div>
      </Card>
    </Frame>
  );
}

// --- A8 ---------------------------------------------------------------------

function PinStep({ me, busy, error, guard }: StepProps) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const stage = pin.length < 6 ? "set" : "confirm";
  const value = stage === "set" ? pin : confirm;
  const mismatch = confirm.length === 6 && confirm !== pin;

  const press = (k: string) => {
    const setter = stage === "set" ? setPin : setConfirm;
    if (k === "del") return setter(value.slice(0, -1));
    if (value.length >= 6) return;
    const next = value + k;
    setter(next);
    if (stage === "confirm" && next.length === 6 && next === pin) {
      guard(() => setTransactionPin(me.id, next), "tier");
    }
  };

  return (
    <Screen>
      <ScreenHeader />
      <div className="flex-1 flex flex-col" style={{ padding: "4px 20px 0" }}>
        <Eyebrow>Step 5 of 5</Eyebrow>
        <div className="flex" style={{ gap: 5, marginTop: 8, marginBottom: 16 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: biya.action }} />
          ))}
        </div>

        <div style={{ ...type.title, fontSize: 26, color: biya.ink }}>
          {stage === "set" ? "Choose your PIN" : "Confirm your PIN"}
        </div>
        <p style={{ ...type.body, color: biya.muted, marginTop: 10 }}>
          Six digits, entered every time money leaves your account. Avoid your date of birth or 123456.
        </p>

        <div className="flex justify-center" style={{ gap: 14, marginTop: 30 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.span
              key={i}
              animate={{ scale: i === value.length - 1 ? [1, 1.25, 1] : 1, x: mismatch ? [0, -4, 4, 0] : 0 }}
              transition={{ duration: 0.2 }}
              style={{
                width: 13, height: 13, borderRadius: "50%",
                backgroundColor: i < value.length ? (mismatch ? biya.fail : biya.action) : "transparent",
                border: i < value.length ? "none" : `1.6px solid ${biya.lineStrong}`,
              }}
            />
          ))}
        </div>

        {mismatch && (
          <p style={{ ...type.body, color: biya.fail, marginTop: 16, textAlign: "center" }}>
            Those do not match. Try again.
          </p>
        )}
        {error && <p style={{ ...type.body, color: biya.fail, marginTop: 16, textAlign: "center" }}>{error}</p>}

        <div className="flex-1" />

        <div className="grid grid-cols-3" style={{ gap: 9, paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k, i) =>
            k === "" ? <span key={i} /> : (
              <button
                key={i}
                onClick={() => { if (mismatch) { setConfirm(""); return; } press(k); }}
                disabled={busy}
                className="flex items-center justify-center transition-transform active:scale-95"
                style={{ height: 56, borderRadius: 13, backgroundColor: biya.surface, border: `1px solid ${biya.line}` }}
              >
                {k === "del" ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9L3 12z" stroke={biya.ink} strokeWidth="1.8" strokeLinejoin="round" />
                    <path d="M12 10l4 4m0-4l-4 4" stroke={biya.ink} strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ) : (
                  <span style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 23, color: biya.ink }}>{k}</span>
                )}
              </button>
            ),
          )}
        </div>
      </div>
    </Screen>
  );
}

// --- A9 ---------------------------------------------------------------------

function TierStep({ me, onNext }: { me: Me; onNext: () => void }) {
  const [tiers, setTiers] = useState<TierLimits[]>([]);
  useEffect(() => { getTierLimits().then(setTiers); }, []);

  const current = tiers.find((t) => t.tier === me.kyc_tier);
  const next = tiers.find((t) => t.tier === me.kyc_tier + 1);
  const money = (v: number | null) => (v === null ? "No limit" : `$${formatUsd(v)}`);

  return (
    <Screen>
      <ScreenHeader />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <span
            className="flex items-center justify-center"
            style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: biya.creditWash }}
          >
            <CheckIcon size={15} />
          </span>
          <span style={{ ...type.body, color: biya.credit }}>Identity confirmed</span>
        </div>

        <div style={{ ...type.title, fontSize: 27, color: biya.ink, marginTop: 14 }}>
          You are on {current?.label ?? `Tier ${me.kyc_tier}`}
        </div>
        <p style={{ ...type.body, color: biya.muted, marginTop: 10 }}>
          {me.first_name}, your account is open. Here is what it can do today.
        </p>

        {current && (
          <Card style={{ marginTop: 22 }}>
            <Bound label="Send per day" value={money(current.sendPerDayMinor)} />
            <Bound label="Hold in your account" value={money(current.holdMaxMinor)} />
            <Bound label="Withdraw to a bank" value={current.withdrawAllowed ? "Included" : "Not yet"} last />
          </Card>
        )}

        {next && (
          <div style={{ marginTop: 22 }}>
            <div className="flex items-center justify-between">
              <Eyebrow>{next.label} adds</Eyebrow>
              {!me.selfie_done && <StatusPill status="pending">Selfie needed</StatusPill>}
            </div>
            <Card style={{ marginTop: 9 }}>
              <Bound label="Send per day" value={money(next.sendPerDayMinor)} />
              <Bound label="Hold in your account" value={money(next.holdMaxMinor)} last />
            </Card>
          </div>
        )}

        <p style={{ ...type.bodySm, color: biya.faint, marginTop: 16 }}>
          These are our current limits and they can change with regulation.
        </p>
      </div>

      <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
        <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
      </div>
    </Screen>
  );
}

function Bound({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "13px 15px", borderBottom: last ? "none" : `1px solid ${biya.hairline}` }}
    >
      <span style={{ ...type.body, color: biya.muted }}>{label}</span>
      <span style={{ ...type.row, fontSize: 15, color: biya.ink }}>{value}</span>
    </div>
  );
}

// --- A10 --------------------------------------------------------------------

function BusinessStep({ me, advance, onFinish }: StepProps & { onFinish: (u: Me) => void }) {
  return (
    <Screen>
      <ScreenHeader />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        <div style={{ ...type.title, fontSize: 27, color: biya.ink }}>Do you sell anything?</div>
        <p style={{ ...type.body, color: biya.muted, marginTop: 10 }}>
          A business account gives you a payment code, naira in your account the moment a customer
          pays, and daily settlement to your bank.
        </p>

        <div className="flex flex-col" style={{ gap: 10, marginTop: 24 }}>
          <Choice
            title="Yes, I run a business"
            blurb="One more question, about thirty seconds. You can stop and come back."
            onClick={() => advance("trading")}
          />
          <Choice
            title="No, just for myself"
            blurb="Straight to your account. You can add a business later from Settings."
            onClick={() => onFinish(me)}
          />
        </div>

        {/* Plain text, never a card. Anything wearing the same surface, border
            and radius as the two choices above reads as a third choice. */}
        <p style={{ ...type.body, color: biya.faint, marginTop: 22 }}>
          Either way it is one app. Personal and business sit behind a switch at the top of the home
          screen, and the tabs never change under you.
        </p>
      </div>
    </Screen>
  );
}

function Choice({ title, blurb, onClick }: { title: string; blurb: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-transform active:scale-[0.99]"
      style={{
        padding: "18px 16px", borderRadius: radius.card,
        backgroundColor: biya.surface, border: `1px solid ${biya.line}`,
      }}
    >
      <div style={{ ...type.row, fontSize: 16, color: biya.ink }}>{title}</div>
      <div style={{ ...type.body, color: biya.faint, marginTop: 5 }}>{blurb}</div>
    </button>
  );
}

function TradingStep({ me, busy, error, onFinish }: StepProps & { onFinish: (u: Me) => void }) {
  const [name, setName] = useState("");
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setWorking(true);
    setErr(null);
    try {
      await createBusinessAccount(me.id, name.trim());
      onFinish({ ...me, is_business: true, business_name: name.trim() });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create that.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Frame
      title="What is it called?"
      blurb="The name customers will see when they pay you."
      action="Finish"
      busy={working || busy}
      error={err ?? error}
      disabled={!name.trim()}
      onAction={submit}
    >
      <Field label="Trading name" value={name} onChange={setName} placeholder="Sabon Gari Stores" autoFocus />
    </Frame>
  );
}
