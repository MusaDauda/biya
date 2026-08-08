import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import jsQR from "jsqr/dist/jsQR.js";
import { biya, brand, clockTime, font, formatNgn, formatRate, formatUsd, initials, radius, type } from "./theme";
import { Avatar, BiyaIcon, Card, Eyebrow, Field, PrimaryButton, Screen, ScreenHeader, Segmented } from "./primitives";
import { AlertIcon, ChevronRight, CopyIcon, GalleryIcon, ShareIcon, TorchIcon } from "./icons";
import {
  findUserByCode, findByTag, findByPhone, getMe, nameOf, payeeFromLookup, personName, resolveAccount,
  type ActivityRow, type FxSnapshot, type Me,
} from "../../../lib/api";

// C1 to C5. Three ways in, one way on.
//
// Scan, Transfer and Receive are modes of one screen rather than three
// destinations, which is why the receive code is no longer a tab of its own.
type Mode = "scan" | "transfer" | "receive";

export function Pay({
  user, fx, recents, mode: initialMode = "scan", receiveAs, onClose, onContinue,
}: {
  user: Me;
  fx: FxSnapshot | null;
  recents: ActivityRow[];
  mode?: Mode;
  /**
   * Whose code Receive shows. In business context a vendor is showing the
   * shop, not themselves, so the name, tag and number all come from there.
   */
  receiveAs?: { name: string; tag: string | null; receiveCode: string };
  onClose: () => void;
  onContinue: (payee: Me, ngnMinor: number, note: string) => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [payee, setPayee] = useState<Me | null>(null);

  if (payee) {
    return (
      <AmountScreen
        payee={payee}
        fx={fx}
        onBack={() => setPayee(null)}
        onReview={(ngnMinor, note) => onContinue(payee, ngnMinor, note)}
      />
    );
  }

  return (
    <div className="h-full relative overflow-hidden" style={{ backgroundColor: mode === "scan" ? brand.night : biya.ground }}>
      {mode === "scan" && <ScanMode onFound={setPayee} onManual={() => setMode("transfer")} onClose={onClose} />}
      {mode === "transfer" && <TransferMode recents={recents} onFound={setPayee} onClose={onClose} />}
      {mode === "receive" && (
        <ReceiveMode
          identity={receiveAs ?? { name: personName(user), tag: user.tag, receiveCode: user.receive_code }}
          onClose={onClose}
        />
      )}

      <div
        className="absolute left-0 right-0 bottom-0 z-30"
        style={{
          padding: "10px 16px",
          paddingBottom: "max(16px, var(--safe-bottom, 0px))",
          backgroundColor: mode === "scan" ? "rgba(12,14,18,0.86)" : biya.surface,
          borderTop: mode === "scan" ? "none" : `1px solid ${biya.line}`,
          backdropFilter: mode === "scan" ? "blur(12px)" : undefined,
        }}
      >
        <ModeBar mode={mode} onChange={setMode} dark={mode === "scan"} />
      </div>
    </div>
  );
}

function ModeBar({ mode, onChange, dark }: { mode: Mode; onChange: (m: Mode) => void; dark: boolean }) {
  const items: { key: Mode; label: string }[] = [
    { key: "scan", label: "Scan" },
    { key: "transfer", label: "Transfer" },
    { key: "receive", label: "Receive" },
  ];
  return (
    <div className="flex" style={{ gap: 4 }}>
      {items.map((i) => {
        const on = i.key === mode;
        return (
          <button
            key={i.key}
            onClick={() => onChange(i.key)}
            className="flex-1 transition-colors"
            style={{
              height: 42, borderRadius: 11,
              backgroundColor: on ? (dark ? "rgba(255,255,255,0.16)" : biya.actionWash) : "transparent",
              fontFamily: font.sans, fontWeight: on ? 600 : 500, fontSize: 14,
              color: on ? (dark ? "#fff" : biya.action) : (dark ? "rgba(255,255,255,0.62)" : biya.muted),
            }}
          >
            {i.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// C1 Scan
//
// The one screen that keeps the night ground, because a viewfinder has no
// light equivalent. Detection logic is unchanged: BarcodeDetector where it
// exists, jsQR everywhere else.
// ---------------------------------------------------------------------------

function ScanMode({
  onFound, onManual, onClose,
}: { onFound: (p: Me) => void; onManual: () => void; onClose: () => void }) {
  const [torch, setTorch] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()?.[0];
    if (!track) return;
    const caps = (track as any).getCapabilities?.();
    if (caps?.torch) {
      try {
        (track as any).applyConstraints({ advanced: [{ torch }] });
      } catch {
        // torch is not available on every device, and that is not an error
      }
    }
  }, [torch]);

  useEffect(() => {
    let raf = 0;
    let detector: any = null;

    async function lookup(raw: string) {
      const digits = (raw ?? "").toString().replace(/\D/g, "");
      if (digits.length !== 10) return null;
      try {
        return await findUserByCode(digits);
      } catch {
        return null;
      }
    }

    function stop() {
      scanningRef.current = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (raf) cancelAnimationFrame(raf);
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) { setDenied(true); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        scanningRef.current = true;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        if ((window as any).BarcodeDetector) {
          detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          const loop = async () => {
            if (!videoRef.current || !scanningRef.current) return;
            try {
              const results = await detector.detect(videoRef.current);
              if (results?.length) {
                const found = await lookup(results[0].rawValue || "");
                if (found) { stop(); onFound(found); return; }
              }
            } catch {
              // a frame that fails to decode is the normal case, not an error
            }
            raf = requestAnimationFrame(loop);
          };
          raf = requestAnimationFrame(loop);
        } else {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const loop = async () => {
            if (!videoRef.current || !scanningRef.current || !ctx) return;
            const w = videoRef.current.videoWidth;
            const h = videoRef.current.videoHeight;
            if (w && h) {
              canvas.width = w; canvas.height = h;
              ctx.drawImage(videoRef.current, 0, 0, w, h);
              const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h);
              if (code?.data) {
                const found = await lookup(code.data);
                if (found) { stop(); onFound(found); return; }
              }
            }
            raf = requestAnimationFrame(loop);
          };
          raf = requestAnimationFrame(loop);
        }
      } catch {
        setDenied(true);
      }
    }

    start();
    return stop;
  }, [onFound]);

  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ opacity: denied ? 0 : 1 }}
        muted
        playsInline
      />
      <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(12,14,18,0.72) 0%, rgba(12,14,18,0.18) 34%, rgba(12,14,18,0.82) 100%)" }} />

      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between"
        style={{ padding: "0 16px", paddingTop: "calc(8px + var(--safe-top, 0px))", height: "calc(56px + var(--safe-top, 0px))" }}
      >
        <button onClick={onClose} aria-label="Close" className="flex items-center justify-center" style={{ width: 38, height: 38 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <span style={{ ...type.title, fontSize: 17, color: "#fff" }}>Pay</span>
        <span style={{ width: 38 }} />
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center" style={{ paddingBottom: 90 }}>
        <div className="relative" style={{ width: 236, height: 236 }}>
          {[
            ["top:0;left:0", "border-top-left-radius:14px;border-top:3px solid;border-left:3px solid"],
            ["top:0;right:0", "border-top-right-radius:14px;border-top:3px solid;border-right:3px solid"],
            ["bottom:0;left:0", "border-bottom-left-radius:14px;border-bottom:3px solid;border-left:3px solid"],
            ["bottom:0;right:0", "border-bottom-right-radius:14px;border-bottom:3px solid;border-right:3px solid"],
          ].map(([pos, border], i) => (
            <span
              key={i}
              style={{
                position: "absolute", width: 38, height: 38, borderColor: brand.indigo,
                ...Object.fromEntries(
                  [...pos.split(";"), ...border.split(";")].map((d) => {
                    const [k, v] = d.split(":");
                    return [k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v];
                  }),
                ),
              } as any}
            />
          ))}
          <motion.span
            className="absolute left-1 right-1"
            style={{ height: 2, backgroundColor: brand.indigo, boxShadow: `0 0 14px ${brand.indigo}`, borderRadius: 2 }}
            animate={{ top: [6, 228, 6] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(255,255,255,0.72)", marginTop: 26 }}>
          {denied ? "Camera unavailable" : "Point at a Biya code"}
        </span>

        <button
          onClick={onManual}
          className="transition-opacity active:opacity-70"
          style={{ marginTop: 14, fontFamily: font.sans, fontWeight: 600, fontSize: 14, color: "#fff", textDecoration: "underline", textUnderlineOffset: 4 }}
        >
          Enter details instead
        </button>
      </div>

      <div className="absolute z-20 flex" style={{ gap: 10, left: 16, right: 16, bottom: 78, justifyContent: "center" }}>
        <RoundControl label="Torch" active={torch} onClick={() => setTorch((t) => !t)}>
          <TorchIcon color={torch ? brand.ink : "#fff"} />
        </RoundControl>
        <RoundControl label="From gallery" onClick={() => toast("Pick a photo of the code from your gallery.")}>
          <GalleryIcon />
        </RoundControl>
      </div>
    </>
  );
}

function RoundControl({
  children, label, active, onClick,
}: { children: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center transition-transform active:scale-95"
      style={{
        gap: 8, height: 40, padding: "0 14px", borderRadius: 999,
        backgroundColor: active ? "#fff" : "rgba(255,255,255,0.16)",
        backdropFilter: "blur(10px)",
      }}
    >
      {children}
      <span style={{ fontFamily: font.sans, fontWeight: 600, fontSize: 13, color: active ? brand.ink : "#fff" }}>{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// C2 Transfer and C3 Bank account
// ---------------------------------------------------------------------------

type Route = "tag" | "phone" | "bank";

function TransferMode({
  recents, onFound, onClose,
}: { recents: ActivityRow[]; onFound: (p: Me) => void; onClose: () => void }) {
  const [route, setRoute] = useState<Route>("tag");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<{ userId: string; name: string } | null>(null);

  useEffect(() => { setValue(""); setError(null); setResolved(null); }, [route]);

  // A ten digit number resolves as soon as it is complete, so the name appears
  // without the person having to press anything.
  useEffect(() => {
    const digits = value.replace(/\D/g, "");
    if (route !== "bank" || digits.length !== 10) { setResolved(null); return; }
    let cancelled = false;
    (async () => {
      const r = await resolveAccount(digits);
      if (cancelled) return;
      if (r.found) { setResolved({ userId: r.userId, name: r.name }); setError(null); }
      else { setResolved(null); setError(r.reason); }
    })();
    return () => { cancelled = true; };
  }, [value, route]);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      if (resolved) {
        const payee = await findUserByCode(value.replace(/\D/g, ""));
        if (payee) { onFound(payee); return; }
      }
      if (route === "tag") {
        const r = await findByTag(value.replace(/^@/, ""));
        if (!r.found) { setError(r.reason); return; }
        const payee = await getMe(r.userId);
        if (payee) { onFound(payeeFromLookup(payee, r)); return; }
      }
      if (route === "phone") {
        const r = await findByPhone(value);
        if (!r.found) { setError(r.reason); return; }
        const payee = await getMe(r.userId);
        if (payee) { onFound(payeeFromLookup(payee, r)); return; }
      }
      setError("Could not find that account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Pay" onBack={onClose} />
      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 110px" }}>
        <Segmented
          value={route}
          onChange={(k) => setRoute(k as Route)}
          options={[
            { key: "tag", label: "Biya tag" },
            { key: "phone", label: "Phone" },
            { key: "bank", label: "Account" },
          ]}
        />

        <div style={{ marginTop: 16 }}>
          <Field
            label={route === "tag" ? "Biya tag" : route === "phone" ? "Phone number" : "Account number"}
            placeholder={route === "tag" ? "@hauwa" : route === "phone" ? "0803 412 7788" : "0114471209"}
            value={value}
            onChange={setValue}
            inputMode={route === "tag" ? "text" : "numeric"}
            maxLength={route === "tag" ? 24 : route === "phone" ? 14 : 10}
            autoFocus
            error={!!error}
            hint={error ?? undefined}
          />
        </div>

        {resolved && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 14 }}>
            <Card>
              <div className="flex items-center" style={{ gap: 12, padding: "14px 15px" }}>
                <Avatar text={initials(resolved.name)} size={40} tone="neutral" />
                <div className="min-w-0">
                  <div className="truncate" style={{ ...type.row, fontSize: 16, color: biya.ink }}>{resolved.name}</div>
                  <div style={{ ...type.bodySm, color: biya.credit, marginTop: 3 }}>Name confirmed</div>
                </div>
              </div>
            </Card>

            <div className="flex" style={{ gap: 9, marginTop: 12, alignItems: "flex-start" }}>
              <AlertIcon size={17} color={biya.pendingText} />
              <p style={{ ...type.body, color: biya.pendingText, flex: 1 }}>
                Check the name yourself before you continue. A transfer to the wrong account cannot be reversed by us.
              </p>
            </div>
          </motion.div>
        )}

      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 72, padding: "0 20px 12px" }}>
        <PrimaryButton onClick={go} disabled={busy || (!resolved && (route === "tag" ? value.replace(/^@/, "").length < 3 : value.replace(/\D/g, "").length < 3))}>
          {busy ? "Checking..." : "Continue"}
        </PrimaryButton>
      </div>
    </Screen>
  );
}


// ---------------------------------------------------------------------------
// C4 Receive
// ---------------------------------------------------------------------------

function ReceiveMode({
  identity, onClose,
}: { identity: { name: string; tag: string | null; receiveCode: string }; onClose: () => void }) {
  const [ask, setAsk] = useState("");
  const handle = identity.tag ? `@${identity.tag}` : identity.receiveCode;

  const copy = async (text: string, said: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(said);
    } catch {
      window.prompt("Copy this:", text);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Receive" onBack={onClose} />
      <div className="flex-1 overflow-y-auto flex flex-col items-center" style={{ padding: "8px 20px 120px" }}>
        <Card style={{ width: "100%", maxWidth: 300 }}>
          <div className="flex flex-col items-center" style={{ padding: "26px 22px 22px" }}>
            <div style={{ position: "relative", padding: 10, backgroundColor: "#fff", borderRadius: 14 }}>
              <QRCodeSVG value={identity.receiveCode} size={186} bgColor="#ffffff" fgColor={brand.ink} level="Q" />
              {/* The brand's code centre: a 44px white tile carrying the monogram. */}
              <span
                className="flex items-center justify-center"
                style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                  width: 44, height: 44, borderRadius: 12, backgroundColor: "#fff",
                }}
              >
                <BiyaIcon size={30} variant="ink" />
              </span>
            </div>

            <div style={{ ...type.title, fontSize: 19, color: biya.ink, marginTop: 18 }}>{identity.name}</div>
            <div style={{ fontFamily: font.mono, fontSize: 13, color: biya.muted, marginTop: 5 }}>{handle}</div>
            <div style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: "0.14em", color: biya.faint, marginTop: 8 }}>
              {identity.receiveCode}
            </div>
          </div>
        </Card>

        <div className="flex" style={{ gap: 9, marginTop: 14, width: "100%", maxWidth: 300 }}>
          <FlatAction onClick={() => copy(handle, "Tag copied.")}><CopyIcon /> Copy tag</FlatAction>
          <FlatAction onClick={() => copy(`Pay ${identity.name} on Biya: ${handle}`, "Code copied.")}><ShareIcon /> Share code</FlatAction>
        </div>

        <div style={{ width: "100%", maxWidth: 300, marginTop: 20 }}>
          <Field
            label="Ask for a set amount"
            placeholder="0"
            value={ask}
            onChange={(v) => setAsk(v.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            hint={ask ? "The code carries this amount, so nobody can type the wrong figure." : "Optional. Leave it empty and they choose."}
          />
        </div>

        <p style={{ ...type.body, color: biya.faint, marginTop: 16, textAlign: "center", maxWidth: 300 }}>
          Money sent to you arrives as dollars at the rate shown to the sender.
        </p>
      </div>
    </Screen>
  );
}

function FlatAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center transition-transform active:scale-[0.97]"
      style={{
        gap: 7, height: 44, borderRadius: 12, backgroundColor: biya.surface,
        border: `1px solid ${biya.line}`, fontFamily: font.sans, fontWeight: 600, fontSize: 13.5, color: biya.ink,
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// C5 Amount
//
// Naira leads because that is what the person being paid receives. The dollar
// cost sits under it, and the rate that produced it is on the same line.
// ---------------------------------------------------------------------------

const QUICK = [500000, 1000000, 2000000]; // kobo

function AmountScreen({
  payee, fx, onBack, onReview,
}: {
  payee: Me;
  fx: FxSnapshot | null;
  onBack: () => void;
  onReview: (ngnMinor: number, note: string) => void;
}) {
  const [naira, setNaira] = useState("");
  const [note, setNote] = useState("");

  const kobo = Math.round(parseFloat(naira || "0") * 100);
  const costCents = fx && kobo > 0 ? Math.ceil(kobo / fx.effectiveRate) : 0;
  const handle = payee.tag ? `@${payee.tag}` : payee.receive_code;

  return (
    <Screen>
      <ScreenHeader title="Amount" onBack={onBack} />

      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 120px" }}>
        <Card>
          <div className="flex items-center" style={{ gap: 12, padding: "13px 14px" }}>
            <Avatar text={initials(nameOf(payee))} size={40} tone="neutral" />
            <div className="min-w-0">
              <div className="truncate" style={{ ...type.rowSm, color: biya.ink }}>{nameOf(payee)}</div>
              <div style={{ fontFamily: font.mono, fontSize: 11.5, color: biya.faint, marginTop: 2 }}>{handle}</div>
            </div>
          </div>
        </Card>

        <div style={{ marginTop: 26 }}>
          <Eyebrow>They receive</Eyebrow>
          <div className="flex items-baseline" style={{ marginTop: 10 }}>
            <span style={{ fontFamily: font.sans, fontWeight: 700, fontSize: 52, lineHeight: 1, letterSpacing: "-0.04em", color: kobo > 0 ? biya.ink : biya.faint }}>
              ₦
            </span>
            <input
              value={naira}
              onChange={(e) => setNaira(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
              placeholder="0"
              inputMode="decimal"
              autoFocus
              className="bg-transparent outline-none min-w-0"
              style={{
                fontFamily: font.sans, fontWeight: 700, fontSize: 52, lineHeight: 1,
                letterSpacing: "-0.04em", color: biya.ink, width: `${Math.max(naira.length || 1, 1)}ch`,
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            {kobo > 0 && fx ? (
              <>
                <div style={{ ...type.row, fontSize: 16, color: biya.inkSoft }}>
                  costs you ${formatUsd(costCents)}
                </div>
                <div style={{ fontFamily: font.mono, fontSize: 11.5, color: biya.faint, marginTop: 6 }}>
                  ₦{formatRate(fx.effectiveRate)} / $1 · {clockTime(fx.fetchedAt)}
                </div>
              </>
            ) : (
              <div style={{ ...type.body, color: biya.faint }}>
                {fx ? "Enter what they should receive." : "Waiting for today's rate."}
              </div>
            )}
          </div>
        </div>

        <div className="flex" style={{ gap: 8, marginTop: 22 }}>
          {QUICK.map((k) => (
            <button
              key={k}
              onClick={() => setNaira(String(k / 100))}
              className="flex-1 transition-transform active:scale-[0.97]"
              style={{
                height: 40, borderRadius: 11, backgroundColor: biya.surface,
                border: `1px solid ${biya.line}`,
                fontFamily: font.sans, fontWeight: 600, fontSize: 13.5, color: biya.ink,
              }}
            >
              ₦{formatNgn(k, false)}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <Field label="Add a note, optional" placeholder="Lunch" value={note} onChange={setNote} maxLength={40} />
        </div>
      </div>

      <div
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 20px",
          paddingBottom: "max(16px, var(--safe-bottom, 0px))",
          backgroundColor: biya.ground, borderTop: `1px solid ${biya.line}`,
        }}
      >
        <PrimaryButton onClick={() => onReview(kobo, note)} disabled={kobo <= 0 || !fx}>
          Review payment
        </PrimaryButton>
      </div>
    </Screen>
  );
}
