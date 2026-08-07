import { useEffect, useState } from "react";
import { biya, font, type } from "./theme";
import { Field, PrimaryButton, Screen, ScreenHeader, TextButton, Wordmark } from "./primitives";
import { CheckIcon } from "./icons";
import {
  logInWithPassword, requestEmailCode, signUpWithPassword, verifyEmailCode, type Me,
} from "../../../lib/api";

// A2 create account, A3 verify, plus log in.
//
// The account exists once the email and password are accepted. Identity and the
// transaction PIN come later, in Onboarding, so nothing here can move money.

type Mode = "signup" | "login" | "verify";

const RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One number", test: (p: string) => /\d/.test(p) },
  { label: "One capital letter", test: (p: string) => /[A-Z]/.test(p) },
];

export function AuthScreen({ onAuth, onBack, start = "signup" }: {
  onAuth: (u: Me) => void;
  onBack: () => void;
  start?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(start);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [pending, setPending] = useState<Me | null>(null);
  const [code, setCode] = useState("");
  const [issued, setIssued] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const passOk = RULES.every((r) => r.test(password));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        onAuth(await logInWithPassword(email, password));
        return;
      }
      const user = await signUpWithPassword(email, password);
      setPending(user);
      setIssued(await requestEmailCode(user.id));
      setSeconds(60);
      setMode("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  };

  // A code is single use, so a second concurrent submission would always fail
  // against a row the first one already consumed.
  const verify = async (value: string) => {
    if (!pending || busy) return;
    setBusy(true);
    setError(null);
    try {
      onAuth(await verifyEmailCode(pending.id, value));
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code is not right.");
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  // --- A3 verify -----------------------------------------------------------

  if (mode === "verify" && pending) {
    return (
      <Screen>
        <ScreenHeader onBack={() => { setMode("signup"); setCode(""); setError(null); }} />
        <div className="flex-1 overflow-y-auto" style={{ padding: "8px 20px 24px" }}>
          <div style={{ ...type.title, fontSize: 26, color: biya.ink }}>Enter your code</div>
          <p style={{ ...type.body, color: biya.muted, marginTop: 10 }}>
            We sent six digits to {pending.email}. It expires in 10 minutes.
          </p>

          <div className="flex justify-center" style={{ gap: 9, marginTop: 30 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="flex items-center justify-center"
                style={{
                  width: 46, height: 56, borderRadius: 12,
                  backgroundColor: biya.surface,
                  border: `1.5px solid ${error ? biya.fail : i === code.length ? biya.action : biya.line}`,
                  fontFamily: font.sans, fontWeight: 700, fontSize: 22, color: biya.ink,
                }}
              >
                {code[i] ?? ""}
              </span>
            ))}
          </div>

          <input
            value={code}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(next);
              setError(null);
              if (next.length === 6) verify(next);
            }}
            inputMode="numeric"
            autoFocus
            className="w-full text-center outline-none bg-transparent"
            style={{ height: 1, opacity: 0, position: "absolute", left: -9999 }}
          />

          {error && <p style={{ ...type.body, color: biya.fail, marginTop: 14, textAlign: "center" }}>{error}</p>}

          <div className="flex items-center justify-center" style={{ gap: 6, marginTop: 22 }}>
            <span style={{ ...type.body, color: biya.faint }}>Resend code in</span>
            <span style={{ fontFamily: font.mono, fontSize: 13, color: seconds > 0 ? biya.faint : biya.action }}>
              {seconds > 0 ? `00:${String(seconds).padStart(2, "0")}` : "ready"}
            </span>
          </div>

          {seconds <= 0 && (
            <div className="text-center" style={{ marginTop: 10 }}>
              <TextButton
                color={biya.action}
                onClick={async () => { setIssued(await requestEmailCode(pending.id)); setSeconds(60); }}
              >
                Send a new code
              </TextButton>
            </div>
          )}

          {/* No mail transport is wired, so the code it issued is offered here
              rather than pretending an email is on its way. */}
          {issued && (
            <button
              onClick={() => { setCode(issued); verify(issued); }}
              className="w-full"
              style={{
                marginTop: 24, padding: "12px 14px", borderRadius: 12,
                backgroundColor: biya.actionWashSoft,
                fontFamily: font.mono, fontSize: 12.5, color: biya.action,
              }}
            >
              Tap to fill {issued}
            </button>
          )}
        </div>

        <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
          <PrimaryButton onClick={() => verify(code)} disabled={code.length !== 6 || busy}>
            {busy ? "Checking..." : "Verify"}
          </PrimaryButton>
        </div>
      </Screen>
    );
  }

  // --- A2 create account, and log in ---------------------------------------

  const ready = email.includes("@") && (mode === "login" ? password.length > 0 : passOk && agreed);

  return (
    <Screen>
      <ScreenHeader onBack={onBack} right={<Wordmark size={24} variant="ink" />} />
      <div className="flex-1 overflow-y-auto" style={{ padding: "8px 20px 24px" }}>
        <div style={{ ...type.title, fontSize: 26, color: biya.ink }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </div>
        <p style={{ ...type.body, color: biya.muted, marginTop: 10 }}>
          {mode === "login"
            ? "Your dollars are where you left them."
            : "You will verify your phone and identity in the next few steps."}
        </p>

        <div style={{ marginTop: 24 }}>
          <Field
            label="Email address"
            placeholder="hauwa.abdullahi@gmail.com"
            value={email}
            onChange={(v) => { setEmail(v); setError(null); }}
            inputMode="email"
            autoFocus
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <Field
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(v) => { setPassword(v); setError(null); }}
            type={reveal ? "text" : "password"}
            right={
              <button
                onClick={(e) => { e.preventDefault(); setReveal((r) => !r); }}
                type="button"
                style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 12.5, color: biya.muted }}
              >
                {reveal ? "Hide" : "Show"}
              </button>
            }
          />
        </div>

        {mode === "signup" && (
          <div style={{ marginTop: 14 }}>
            {RULES.map((r) => {
              const ok = r.test(password);
              return (
                <div key={r.label} className="flex items-center" style={{ gap: 8, marginTop: 7 }}>
                  <span
                    className="flex items-center justify-center"
                    style={{
                      width: 17, height: 17, borderRadius: "50%",
                      backgroundColor: ok ? biya.creditWash : biya.ground,
                    }}
                  >
                    {ok
                      ? <CheckIcon size={11} weight={3.2} />
                      : <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: biya.lineStrong }} />}
                  </span>
                  <span style={{ ...type.bodySm, color: ok ? biya.credit : biya.faint }}>{r.label}</span>
                </div>
              );
            })}

            <button
              onClick={() => setAgreed((a) => !a)}
              className="flex items-start text-left"
              style={{ gap: 10, marginTop: 18 }}
            >
              <span
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 20, height: 20, borderRadius: 6, marginTop: 1,
                  backgroundColor: agreed ? biya.action : biya.surface,
                  border: `1.5px solid ${agreed ? biya.action : biya.lineStrong}`,
                }}
              >
                {agreed && <CheckIcon size={12} color="#fff" weight={3} />}
              </span>
              <span style={{ ...type.body, color: biya.muted }}>
                I agree to the Terms of Service and the Privacy Policy.
              </span>
            </button>
          </div>
        )}

        {error && <p style={{ ...type.body, color: biya.fail, marginTop: 16 }}>{error}</p>}
      </div>

      <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
        <PrimaryButton onClick={submit} disabled={!ready || busy}>
          {busy ? "One moment..." : mode === "login" ? "Log in" : "Continue"}
        </PrimaryButton>
        <div className="text-center" style={{ marginTop: 14 }}>
          <span style={{ ...type.body, color: biya.faint }}>
            {mode === "login" ? "New here? " : "Already have an account? "}
          </span>
          <TextButton
            color={biya.action}
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </TextButton>
        </div>
      </div>
    </Screen>
  );
}
