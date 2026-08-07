import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  biya, brand, font, formatNgn, formatRate, formatUsd, initials, radius, type,
} from "./theme";
import {
  Avatar, BiyaIcon, Card, Eyebrow, PrimaryButton, Screen, ScreenHeader, SecondaryButton,
} from "./primitives";
import { AlertIcon, CheckIcon, ClockIcon, ShareIcon } from "./icons";
import {
  createQuote, executePayment, nameOf, quoteProposal, resolveProposal,
  type Balances, type FxSnapshot, type Me, type PaymentResult, type Quote,
} from "../../../lib/api";

type Stage = "quoting" | "review" | "expired" | "short" | "pin" | "paying" | "done" | "failed";

const PIN_LENGTH = 6;

/**
 * The whole payment, from a resolved payee to a receipt.
 *
 * The rate hold is the centre of this screen and it is deliberately not a
 * draining red bar. It is not a session about to expire, it is a rate being
 * held for you, and those two things must not look the same.
 */
export function PayFlow({
  payer, payee, ngnMinor, note, balances, fx, proposalId, onClose, onDone,
}: {
  payer: Me;
  payee: Me;
  ngnMinor: number;
  note?: string;
  balances: Balances;
  fx: FxSnapshot | null;
  /** Set when this came from an assistant proposal, so the two are linked. */
  proposalId?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [stage, setStage] = useState<Stage>("quoting");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [previous, setPrevious] = useState<Quote | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);

  const getQuote = async (keepOld = false) => {
    if (keepOld && quote) setPrevious(quote);
    setStage("quoting");
    setError("");
    setPin("");
    try {
      const q = proposalId ? await quoteProposal(proposalId) : await createQuote(payer.id, payee.id, ngnMinor);
      setQuote(q);
      setStage(q.usdMinor > balances.usdMinor ? "short" : keepOld ? "expired" : "review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get a rate.");
      setStage("failed");
    }
  };

  useEffect(() => { getQuote(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Once the hold runs out the quote is dead, so we requote rather than let
  // someone submit into a guaranteed rejection.
  useEffect(() => {
    if (!quote || (stage !== "review" && stage !== "pin")) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((quote.expiresAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) getQuote(true);
    };
    tick();
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [quote, stage]);

  const pay = async (entered: string) => {
    if (!quote) return;
    setStage("paying");
    // Held locally, not read back from state: the setter has not flushed by the
    // time the await returns, so reading `startedAt` here measures from the epoch.
    const began = Date.now();
    try {
      const res = await executePayment(quote.id, entered);
      if (proposalId) await resolveProposal(proposalId, "confirmed").catch(() => {});
      setResult(res);
      setElapsed(Math.max(1, Math.round((Date.now() - began) / 1000)));
      setStage("done");
      celebrate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
      setPin("");
      setStage("failed");
    }
  };

  const payeeName = nameOf(payee);

  if (stage === "quoting") {
    return (
      <Screen>
        <ScreenHeader onBack={onClose} />
        <div className="flex-1 flex flex-col items-center justify-center" style={{ gap: 14 }}>
          <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <BiyaIcon size={34} variant="indigo" />
          </motion.span>
          <span style={{ fontFamily: font.mono, fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", color: biya.faint }}>
            Getting today's rate
          </span>
        </div>
      </Screen>
    );
  }

  if (stage === "done" && result) {
    return (
      <Receipt
        payeeName={payeeName}
        result={result}
        quote={quote}
        note={note}
        elapsed={elapsed}
        balances={balances}
        fx={fx}
        onDone={onDone}
      />
    );
  }

  if (stage === "paying") {
    return <Processing payeeName={payeeName} quote={quote} onLeave={onDone} />;
  }

  if (stage === "failed") {
    return (
      <Failed
        payeeName={payeeName}
        reason={error}
        quote={quote}
        onRetry={() => getQuote()}
        onClose={onClose}
      />
    );
  }

  if (stage === "short" && quote) {
    return (
      <Shortfall
        payeeName={payeeName}
        quote={quote}
        balances={balances}
        fx={fx}
        onBack={onClose}
        onAddMoney={onClose}
      />
    );
  }

  if (stage === "expired" && quote) {
    return (
      <Requote
        payeeName={payeeName}
        quote={quote}
        previous={previous}
        onPay={() => setStage("pin")}
        onCancel={onClose}
      />
    );
  }

  if (stage === "pin" && quote) {
    return (
      <PinSheet
        quote={quote}
        payeeName={payeeName}
        pin={pin}
        onPin={(next) => {
          setPin(next);
          if (next.length === PIN_LENGTH) pay(next);
        }}
        onBack={() => { setPin(""); setStage("review"); }}
      />
    );
  }

  if (!quote) return null;

  return (
    <Review
      quote={quote}
      payeeName={payeeName}
      note={note}
      balances={balances}
      remaining={remaining}
      onBack={onClose}
      onConfirm={() => setStage("pin")}
    />
  );
}

// ---------------------------------------------------------------------------
// C6 Review
// ---------------------------------------------------------------------------

function Review({
  quote, payeeName, note, balances, remaining, onBack, onConfirm,
}: {
  quote: Quote; payeeName: string; note?: string; balances: Balances;
  remaining: number; onBack: () => void; onConfirm: () => void;
}) {
  const after = balances.usdMinor - quote.usdMinor;
  const dollarCost = quote.usdMinor - quote.feeUsdMinor;

  return (
    <Screen>
      <ScreenHeader title="Review" onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        <Eyebrow>{payeeName} receives</Eyebrow>
        <div style={{ ...type.balance, color: biya.ink, marginTop: 10 }}>₦{formatNgn(quote.ngnMinor)}</div>

        <Card style={{ marginTop: 22 }}>
          <Line label="Converted at" value={`₦${formatRate(quote.rate)} / $1`} mono />
          <Line label="Dollar cost" value={`$${formatUsd(dollarCost)}`} />
          <Line label="Biya fee, 0.75%" value={`$${formatUsd(quote.feeUsdMinor)}`} />
          <Line label="Bank charge" value="None" last />
        </Card>

        <div className="flex items-baseline justify-between" style={{ marginTop: 18 }}>
          <span style={{ ...type.row, fontSize: 16, color: biya.ink }}>You pay</span>
          <span style={{ fontFamily: font.sans, fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", color: biya.ink }}>
            ${formatUsd(quote.usdMinor)}
          </span>
        </div>

        <Card style={{ marginTop: 16 }}>
          <div className="flex items-center justify-between" style={{ padding: "13px 15px" }}>
            <div className="min-w-0">
              <div style={{ ...type.rowSm, color: biya.ink }}>Paying from dollars</div>
              <div style={{ ...type.bodySm, color: biya.faint, marginTop: 3 }}>
                ${formatUsd(balances.usdMinor)} available, ${formatUsd(after)} after
              </div>
            </div>
          </div>
        </Card>

        {note && (
          <Card style={{ marginTop: 10 }}>
            <div className="flex items-center justify-between" style={{ padding: "13px 15px" }}>
              <span style={{ ...type.bodySm, color: biya.faint }}>Note</span>
              <span style={{ ...type.rowSm, color: biya.ink }}>{note}</span>
            </div>
          </Card>
        )}

        <div className="flex items-center" style={{ gap: 8, marginTop: 18 }}>
          <ClockIcon size={16} color={remaining > 20 ? biya.credit : biya.pendingText} />
          <span style={{ ...type.body, color: biya.muted }}>
            Rate held for{" "}
            <span style={{ fontFamily: font.mono, fontWeight: 700, color: remaining > 20 ? biya.credit : biya.pendingText }}>
              {mmss(remaining)}
            </span>
            . If it runs out we will requote before anything moves.
          </span>
        </div>
      </div>

      <div
        style={{
          padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))",
          borderTop: `1px solid ${biya.line}`, backgroundColor: biya.ground,
        }}
      >
        <SlideToPay label={`Slide to pay $${formatUsd(quote.usdMinor)}`} onComplete={onConfirm} />
      </div>
    </Screen>
  );
}

function Line({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "12px 15px", borderBottom: last ? "none" : `1px solid ${biya.hairline}` }}
    >
      <span style={{ ...type.body, color: biya.muted }}>{label}</span>
      <span style={mono
        ? { fontFamily: font.mono, fontSize: 12.5, color: biya.ink }
        : { ...type.rowSm, color: biya.ink }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Slide, not tap. The last control before money moves should take a deliberate
 * gesture, and it also cannot be double fired.
 */
function SlideToPay({ label, onComplete }: { label: string; onComplete: () => void }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [x, setX] = useState(0);
  const [width, setWidth] = useState(0);
  const [done, setDone] = useState(false);
  const dragging = useRef(false);

  useEffect(() => {
    const measure = () => setWidth(trackRef.current?.offsetWidth ?? 0);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const KNOB = 46;
  const travel = Math.max(0, width - KNOB - 8);

  const move = (clientX: number) => {
    if (!dragging.current || !trackRef.current || done) return;
    const rect = trackRef.current.getBoundingClientRect();
    const next = Math.min(travel, Math.max(0, clientX - rect.left - KNOB / 2));
    setX(next);
    if (travel > 0 && next >= travel * 0.9) {
      dragging.current = false;
      setDone(true);
      setX(travel);
      onComplete();
    }
  };

  const end = () => {
    dragging.current = false;
    if (!done) setX(0);
  };

  return (
    <div
      ref={trackRef}
      className="relative select-none"
      style={{ height: 54, borderRadius: radius.control, backgroundColor: biya.action, overflow: "hidden", touchAction: "none" }}
      onPointerMove={(e) => move(e.clientX)}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={end}
    >
      <span
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          fontFamily: font.sans, fontWeight: 600, fontSize: 16, color: "#fff",
          opacity: travel ? Math.max(0.25, 1 - x / travel) : 1,
        }}
      >
        {label}
      </span>
      <div
        onPointerDown={(e) => { dragging.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
        className="absolute flex items-center justify-center"
        style={{
          top: 4, left: 4, width: KNOB, height: 46, borderRadius: 11,
          backgroundColor: "#fff", transform: `translateX(${x}px)`,
          transition: dragging.current ? "none" : "transform 180ms ease",
          cursor: "grab",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke={brand.indigo} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// C7 PIN
// ---------------------------------------------------------------------------

function PinSheet({
  quote, payeeName, pin, onPin, onBack,
}: { quote: Quote; payeeName: string; pin: string; onPin: (v: string) => void; onBack: () => void }) {
  const press = (k: string) => {
    if (k === "del") return onPin(pin.slice(0, -1));
    if (pin.length >= PIN_LENGTH) return;
    onPin(pin + k);
  };

  return (
    <Screen>
      <ScreenHeader onBack={onBack} />
      <div className="flex-1 flex flex-col" style={{ padding: "0 20px" }}>
        <div className="text-center" style={{ paddingTop: 8 }}>
          <div style={{ ...type.balance, color: biya.ink }}>₦{formatNgn(quote.ngnMinor)}</div>
        </div>

        <div className="text-center" style={{ marginTop: 26 }}>
          <div style={{ ...type.title, fontSize: 18, color: biya.ink }}>Enter your PIN</div>
          <div style={{ ...type.body, color: biya.faint, marginTop: 6 }}>
            ₦{formatNgn(quote.ngnMinor)} to {payeeName}
          </div>
        </div>

        <div className="flex justify-center" style={{ gap: 14, marginTop: 24 }}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <motion.span
              key={i}
              animate={{ scale: i === pin.length - 1 ? [1, 1.25, 1] : 1 }}
              transition={{ duration: 0.18 }}
              style={{
                width: 13, height: 13, borderRadius: "50%",
                backgroundColor: i < pin.length ? biya.action : "transparent",
                border: i < pin.length ? "none" : `1.6px solid ${biya.lineStrong}`,
              }}
            />
          ))}
        </div>

        <div className="flex-1" />

        <div className="grid grid-cols-3" style={{ gap: 9, paddingBottom: 10 }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k, i) =>
            k === "" ? <span key={i} /> : (
              <button
                key={i}
                onClick={() => press(k)}
                className="flex items-center justify-center transition-transform active:scale-95"
                style={{
                  height: 56, borderRadius: 13, backgroundColor: biya.surface,
                  border: `1px solid ${biya.line}`,
                }}
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

        <div className="text-center" style={{ paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
          <button
            onClick={() => toast("Fingerprint is not set up on this device yet.")}
            style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 13, color: biya.muted }}
          >
            Use fingerprint instead
          </button>
        </div>
      </div>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// C8 Processing
// ---------------------------------------------------------------------------

function Processing({ payeeName, quote, onLeave }: { payeeName: string; quote: Quote | null; onLeave: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const a = setTimeout(() => setStep(1), 700);
    const b = setTimeout(() => setStep(2), 1500);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  const steps = [
    "Dollars taken from your account",
    quote ? `Converting at ₦${formatRate(quote.rate)}` : "Converting",
    "Naira paid out",
  ];

  return (
    <Screen>
      <ScreenHeader />
      <div className="flex-1 flex flex-col" style={{ padding: "12px 20px" }}>
        <Eyebrow>Sending</Eyebrow>
        <div style={{ ...type.balance, color: biya.ink, marginTop: 10 }}>
          ₦{formatNgn(quote?.ngnMinor ?? 0)}
        </div>
        <div style={{ ...type.row, fontSize: 15, color: biya.inkSoft, marginTop: 8 }}>to {payeeName}</div>

        <Card style={{ marginTop: 28 }}>
          {steps.map((label, i) => (
            <div
              key={label}
              className="flex items-center"
              style={{ gap: 12, padding: "14px 15px", borderBottom: i === steps.length - 1 ? "none" : `1px solid ${biya.hairline}` }}
            >
              <span
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  backgroundColor: i <= step ? biya.creditWash : biya.ground,
                }}
              >
                {i < step ? (
                  <CheckIcon size={13} weight={3} />
                ) : i === step ? (
                  <motion.span
                    animate={{ scale: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                    style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: biya.credit }}
                  />
                ) : (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: biya.lineStrong }} />
                )}
              </span>
              <span style={{ ...type.body, fontSize: 13.5, color: i <= step ? biya.ink : biya.faint }}>{label}</span>
            </div>
          ))}
        </Card>

        <p style={{ ...type.body, color: biya.faint, marginTop: 18 }}>
          You can leave this screen. We will notify you and the receipt will be in Activity either way.
        </p>

        <div className="flex-1" />
        <div style={{ paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
          <SecondaryButton onClick={onLeave}>Back to home</SecondaryButton>
        </div>
      </div>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// C9 Receipt
// ---------------------------------------------------------------------------

function Receipt({
  payeeName, result, quote, note, elapsed, balances, fx, onDone,
}: {
  payeeName: string; result: PaymentResult; quote: Quote | null; note?: string;
  elapsed: number; balances: Balances; fx: FxSnapshot | null; onDone: () => void;
}) {
  const reference = `BIYA-${result.txnId.slice(0, 4).toUpperCase()}-${result.txnId.slice(-4).toUpperCase()}`;
  const after = balances.usdMinor - result.usdMinor;

  return (
    <Screen>
      <ScreenHeader title="Done" />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        <Card>
          <div className="flex flex-col items-center text-center" style={{ padding: "26px 20px 22px" }}>
            <BiyaIcon size={22} variant="ink" />
            <Eyebrow>{" "}</Eyebrow>
            <div style={{ ...type.balance, fontSize: 38, color: biya.ink, marginTop: 12 }}>
              ₦{formatNgn(result.ngnMinor)}
            </div>
            <div style={{ ...type.row, fontSize: 15, color: biya.inkSoft, marginTop: 8 }}>{payeeName}</div>
            <div className="flex items-center" style={{ gap: 6, marginTop: 12 }}>
              <CheckIcon size={15} />
              <span style={{ ...type.bodySm, color: biya.credit }}>
                Received in {elapsed} {elapsed === 1 ? "second" : "seconds"}
              </span>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${biya.hairline}` }}>
            <Line label="You paid" value={`$${formatUsd(result.usdMinor)}`} />
            {quote && <Line label="Rate used" value={`₦${formatRate(quote.rate)} / $1`} mono />}
            {quote && <Line label="Fee" value={`$${formatUsd(quote.feeUsdMinor)}`} />}
            {note && <Line label="Note" value={note} />}
            <Line label="Time" value={new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} />
            <Line label="Reference" value={reference} mono last />
          </div>
        </Card>

        <div className="flex" style={{ gap: 9, marginTop: 14 }}>
          <MiniAction onClick={() => share(reference, payeeName, result)}><ShareIcon size={16} /> Share</MiniAction>
          <MiniAction onClick={onDone}>Pay again</MiniAction>
          <MiniAction onClick={() => toast("Support will see this reference.")}>Report</MiniAction>
        </div>

        <p style={{ ...type.body, color: biya.faint, marginTop: 18 }}>
          Your balance is now ${formatUsd(after)}
          {fx ? `, about ₦${formatNgn(Math.round(after * fx.effectiveRate))} at the current rate.` : "."}
        </p>
      </div>

      <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
        <PrimaryButton onClick={onDone}>Back to home</PrimaryButton>
      </div>
    </Screen>
  );
}

function MiniAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center transition-transform active:scale-[0.97]"
      style={{
        gap: 6, height: 42, borderRadius: 11, backgroundColor: biya.surface,
        border: `1px solid ${biya.line}`, fontFamily: font.sans, fontWeight: 600, fontSize: 13, color: biya.ink,
      }}
    >
      {children}
    </button>
  );
}

async function share(reference: string, payeeName: string, result: PaymentResult) {
  const text = `Paid ₦${formatNgn(result.ngnMinor)} to ${payeeName} on Biya. Reference ${reference}`;
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); toast.success("Receipt copied."); }
  } catch {
    // a cancelled share sheet is not a failure
  }
}

// ---------------------------------------------------------------------------
// D2 Requote, D3 Shortfall, D4 Failure
// ---------------------------------------------------------------------------

function Requote({
  payeeName, quote, previous, onPay, onCancel,
}: { payeeName: string; quote: Quote; previous: Quote | null; onPay: () => void; onCancel: () => void }) {
  const diff = previous ? quote.usdMinor - previous.usdMinor : 0;

  return (
    <Screen>
      <ScreenHeader onBack={onCancel} />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        <div style={{ ...type.balance, color: biya.ink }}>₦{formatNgn(quote.ngnMinor)}</div>

        <div className="flex items-center" style={{ gap: 8, marginTop: 20 }}>
          <ClockIcon size={18} />
          <span style={{ ...type.title, fontSize: 20, color: biya.ink }}>The rate moved while you were reviewing</span>
        </div>

        <p style={{ ...type.body, color: biya.muted, marginTop: 10 }}>
          Nothing has left your account. {payeeName} still receives ₦{formatNgn(quote.ngnMinor)}, it just costs
          {diff === 0 ? " the same" : diff < 0 ? " slightly less" : " slightly more"} now.
        </p>

        <Card style={{ marginTop: 20 }}>
          {previous && <Line label="Old rate" value={`₦${formatRate(previous.rate)} / $1`} mono />}
          <Line label="New rate" value={`₦${formatRate(quote.rate)} / $1`} mono last={!previous} />
          {previous && (
            <div className="flex items-center justify-between" style={{ padding: "12px 15px" }}>
              <span style={{ ...type.body, color: biya.muted }}>You now pay</span>
              <span className="text-right">
                <span className="block" style={{ fontFamily: font.sans, fontWeight: 700, fontSize: 20, color: biya.ink }}>
                  ${formatUsd(quote.usdMinor)}
                </span>
                {diff !== 0 && (
                  <span className="block" style={{ ...type.bodySm, color: diff < 0 ? biya.credit : biya.pendingText, marginTop: 2 }}>
                    ${formatUsd(Math.abs(diff))} {diff < 0 ? "less" : "more"} than before
                  </span>
                )}
              </span>
            </div>
          )}
        </Card>
      </div>

      <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
        <PrimaryButton onClick={onPay}>Pay ${formatUsd(quote.usdMinor)}</PrimaryButton>
        <div style={{ height: 9 }} />
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
      </div>
    </Screen>
  );
}

function Shortfall({
  payeeName, quote, balances, fx, onBack, onAddMoney,
}: {
  payeeName: string; quote: Quote; balances: Balances; fx: FxSnapshot | null;
  onBack: () => void; onAddMoney: () => void;
}) {
  const gap = quote.usdMinor - balances.usdMinor;
  const maxNgn = fx ? Math.floor(balances.usdMinor * fx.effectiveRate) : 0;

  return (
    <Screen>
      <ScreenHeader title="Amount" onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        <Eyebrow>{payeeName} receives</Eyebrow>
        <div style={{ ...type.balance, fontSize: 44, color: biya.ink, marginTop: 10 }}>₦{formatNgn(quote.ngnMinor)}</div>
        <div style={{ ...type.row, fontSize: 16, color: biya.inkSoft, marginTop: 10 }}>
          costs you ${formatUsd(quote.usdMinor)}
        </div>

        <div className="flex" style={{ gap: 9, marginTop: 18, alignItems: "flex-start" }}>
          <AlertIcon size={17} color={biya.pendingText} />
          <p style={{ ...type.body, color: biya.pendingText, flex: 1 }}>
            That is ${formatUsd(gap)} more than you have. Add money, or send up to ₦{formatNgn(maxNgn)}.
          </p>
        </div>
      </div>

      <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
        <PrimaryButton onClick={onAddMoney}>Add money</PrimaryButton>
        <div style={{ height: 9 }} />
        <SecondaryButton onClick={onBack}>Change the amount</SecondaryButton>
      </div>
    </Screen>
  );
}

function Failed({
  payeeName, reason, quote, onRetry, onClose,
}: { payeeName: string; reason: string; quote: Quote | null; onRetry: () => void; onClose: () => void }) {
  return (
    <Screen>
      <ScreenHeader onBack={onClose} right={<BiyaIcon size={24} variant="ink" />} />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 24px" }}>
        <div style={{ marginBottom: 14 }}>
          <span
            className="inline-flex items-center"
            style={{ gap: 6, padding: "5px 10px", borderRadius: radius.pill, backgroundColor: biya.failWash }}
          >
            <span style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 11, color: biya.fail }}>Not sent</span>
          </span>
        </div>

        <div style={{ ...type.title, fontSize: 22, color: biya.ink }}>{reason || "That payment did not go through"}</div>

        <p style={{ ...type.body, color: biya.muted, marginTop: 10 }}>
          Nothing left your account, and no fee was charged.
        </p>

        <Card style={{ marginTop: 20 }}>
          <Line label="Going to" value={payeeName} />
          {quote && <Line label="Amount" value={`₦${formatNgn(quote.ngnMinor)}`} last />}
        </Card>
      </div>

      <div style={{ padding: "12px 20px", paddingBottom: "max(16px, var(--safe-bottom, 0px))" }}>
        <PrimaryButton onClick={onRetry}>Try again</PrimaryButton>
        <div style={{ height: 9 }} />
        <SecondaryButton onClick={onClose}>Go back</SecondaryButton>
      </div>
    </Screen>
  );
}

// ---------------------------------------------------------------------------

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function celebrate() {
  try {
    confetti({
      particleCount: 70,
      spread: 62,
      origin: { y: 0.32 },
      colors: [brand.indigo, brand.credit, brand.ink],
      disableForReducedMotion: true,
    });
  } catch {
    // confetti is decoration, never a reason for a receipt to fail to render
  }
}
