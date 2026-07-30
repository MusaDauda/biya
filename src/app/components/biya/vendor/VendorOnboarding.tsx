import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { renderToStaticMarkup } from "react-dom/server";
import { Store, Phone, Building2, Landmark, Check, ArrowRight, Download, Share2 } from "lucide-react";
import { biya, font } from "../theme";
import { QRCode } from "./QRCode";
import { supabase } from "../../../../lib/supabase";
import { buildVendorDetails, randomVendorCode } from "../demoData";
import type { VendorProfile } from "../data";

type Dest = "cleva" | "bank";

export function VendorOnboarding({ userId, onSaved }: { userId: string; onSaved: (profile: VendorProfile) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dest, setDest] = useState<Dest>("cleva");
  const [clevaTag, setClevaTag] = useState("");
  const [bankName, setBankName] = useState("");
  const [account, setAccount] = useState("");
  const [vendorCode] = useState(() => randomVendorCode());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canNext =
    step === 0 ? name.trim().length > 1 && phone.trim().length >= 7 :
    step === 1 ? (dest === "cleva" ? clevaTag.trim().length > 1 : bankName.trim().length > 1 && account.trim().length >= 10) :
    step === 2 ? !saving :
    true;

  const saveProfile = async () => {
    setSaving(true);
    setError("");
    const payoutLabel = dest === "cleva" ? clevaTag.trim() : `${bankName.trim()} • ${account.trim()}`;

    const details = buildVendorDetails({
      campus: "ABU Samaru Campus",
      code: vendorCode,
      payoutType: dest,
      payoutLabel,
    });

    const { data, error: saveError } = await supabase
      .from("users")
      .upsert(
        {
          id: userId,
          type: "vendor",
          name: name.trim(),
          details,
        },
        { onConflict: ["id"] }
      )
      .select("id, name, details")
      .single();

    if (saveError || !data) {
      console.error("Vendor save failed", saveError);
      setError("Could not save vendor profile. Please try again.");
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved({
      id: data.id,
      name: data.name,
      details,
    });
  };

  const next = () => {
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    saveProfile();
  };

  const handlePrintQr = () => {
    const qrMarkup = renderToStaticMarkup(<QRCode seed={vendorCode} size={220} />);
    const printWindow = window.open("", "_blank", "width=800,height=900");

    if (!printWindow) {
      window.print();
      return;
    }

    const title = `${name || "My stall"} · Biya account`;
    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; background: #fff; color: #000218; }
            .card { width: 100%; max-width: 520px; margin: 40px auto; padding: 28px 24px; border: 1px solid #e4e2df; border-radius: 24px; text-align: center; box-shadow: 0 12px 32px rgba(0,0,0,0.06); }
            .brand { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
            .label { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #71717a; margin-bottom: 20px; }
            .qr { display: flex; justify-content: center; margin: 8px 0 20px; }
            .name { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
            .sub { font-size: 13px; color: #71717a; margin-bottom: 8px; }
            .code { font-size: 16px; font-weight: 700; letter-spacing: 0.2em; }
            @media print { body { background: #fff; } .card { box-shadow: none; border-color: #ddd; margin: 0 auto; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">Biya</div>
            <div class="label">Scan to pay</div>
            <div class="qr">${qrMarkup}</div>
            <div class="name">${name || "My stall"}</div>
            <div class="sub">ABU · Samaru Campus</div>
            <div class="code">Account number: ${vendorCode}</div>
          </div>
        </body>
      </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: biya.cream }}>
      <header className="px-6 pt-8 pb-4 print:hidden">
        <div className="flex items-center gap-2 mb-5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex-1 rounded-full transition-all" style={{ height: 5, backgroundColor: i <= step ? biya.marigold : biya.muteDeep }} />
          ))}
        </div>
        <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "1px", color: biya.gray }}>STEP {step + 1} OF 3</span>
      </header>

      <div className="flex-1 overflow-y-auto px-6">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <span className="flex items-center justify-center rounded-3xl mb-5" style={{ width: 56, height: 56, backgroundColor: biya.peach }}>
                <Store size={26} color={biya.gold} />
              </span>
              <h1 style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: biya.ink }}>Set up your stall</h1>
              <p className="mb-6" style={{ fontFamily: font.display, fontSize: 15, color: biya.gray }}>Tell us about your business.</p>

              <Field label="BUSINESS NAME" icon={Store}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Iya Basira Food" style={inputStyle} />
              </Field>
              <Field label="PHONE FOR SMS ALERTS" icon={Phone}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080 0000 0000" inputMode="tel" style={inputStyle} />
              </Field>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: biya.ink }}>Where should we pay you?</h1>
              <p className="mb-6" style={{ fontFamily: font.display, fontSize: 15, color: biya.gray }}>We settle your takings here every night.</p>

              <div className="flex flex-col gap-3 mb-5">
                <DestOption active={dest === "cleva"} onClick={() => setDest("cleva")} icon={Building2} title="Cleva account" sub="Instant, no bank needed" />
                <DestOption active={dest === "bank"} onClick={() => setDest("bank")} icon={Landmark} title="Bank account" sub="Settled by 9pm daily" />
              </div>

              {dest === "cleva" ? (
                <Field label="CLEVA TAG" icon={Building2}>
                  <input value={clevaTag} onChange={(e) => setClevaTag(e.target.value)} placeholder="@iyabasira" style={inputStyle} />
                </Field>
              ) : (
                <>
                  <Field label="BANK NAME" icon={Landmark}>
                    <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. GTBank" style={inputStyle} />
                  </Field>
                  <Field label="ACCOUNT NUMBER" icon={Landmark}>
                    <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="0123456789" inputMode="numeric" style={inputStyle} />
                  </Field>
                </>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center text-center">
              <h1 style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: biya.ink }}>Your Biya account number</h1>
              <p className="mb-6" style={{ fontFamily: font.display, fontSize: 15, color: biya.gray }}>Print it and stick it on your counter.</p>

              <div className="rounded-[32px] bg-white p-8 flex flex-col items-center" style={{ border: `1px solid ${biya.line}`, boxShadow: "0px 20px 40px rgba(0,0,0,0.06)" }}>
                <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: biya.gold }}>Biya</span>
                <p className="mb-4" style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "1px", color: biya.gray }}>SCAN TO PAY</p>
                <QRCode seed={vendorCode} size={200} />
                <p className="mt-4" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 18, color: biya.ink }}>{name || "Iya Basira Food"}</p>
                <p style={{ fontFamily: font.mono, fontSize: 12, color: biya.gray }}>ABU · Samaru Campus</p>
                <p className="mt-2" style={{ fontFamily: font.mono, fontSize: 14, letterSpacing: "0.15em", color: biya.ink }}>Account number: {vendorCode}</p>
              </div>

              <div className="flex gap-3 w-full mt-5 print:hidden">
                <button onClick={handlePrintQr} className="flex-1 flex items-center justify-center gap-2 rounded-full py-3.5 cursor-pointer" style={{ backgroundColor: biya.mute }}>
                  <Download size={16} color={biya.ink} />
                  <span style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: biya.ink }}>PRINT QR CODE</span>
                </button>
                <button onClick={async () => {
                  const shareText = `Pay ${name || "My stall"} on Biya using account number ${vendorCode}`;
                  const title = "Share your Biya account number";
                  try {
                    if (navigator.share) {
                      await navigator.share({ title, text: shareText });
                    } else if (navigator.clipboard) {
                      await navigator.clipboard.writeText(shareText);
                      alert("Share text copied to clipboard.");
                    } else {
                      window.prompt("Copy this text to share:", shareText);
                    }
                  } catch (error) {
                    console.error(error);
                    alert("Could not share. Please copy the account number manually.");
                  }
                }} className="flex-1 flex items-center justify-center gap-2 rounded-full py-3.5 cursor-pointer" style={{ backgroundColor: biya.mute }}>
                  <Share2 size={16} color={biya.ink} />
                  <span style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: biya.ink }}>SHARE</span>
                </button>
              </div>
              {error && (
                <p className="mt-3" style={{ fontFamily: font.display, fontSize: 13, color: biya.red }}>
                  {error}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 pb-10 pt-4 print:hidden">
        <button
          onClick={next}
          disabled={!canNext}
          className="w-full flex items-center justify-center gap-2 rounded-full transition-transform active:scale-[0.98]"
          style={{ height: 56, backgroundColor: canNext ? biya.marigold : biya.muteDeep, opacity: canNext ? 1 : 0.6 }}
        >
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: canNext ? biya.goldDeep : biya.gray }}>
            {step === 2 ? (saving ? "Saving..." : "Done, start receiving payments") : "Continue"}
          </span>
          {step === 2 ? <Check size={18} color={biya.goldDeep} /> : <ArrowRight size={18} color={canNext ? biya.goldDeep : biya.gray} />}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "transparent", outline: "none", border: "none",
  fontFamily: font.display, fontSize: 16, color: biya.ink,
};

function Field({ label, icon: Icon, children }: { label: string; icon: React.ComponentType<{ size?: number; color?: string }>; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "0.8px", color: biya.gray }}>{label}</label>
      <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 mt-1.5" style={{ border: `1px solid ${biya.line}` }}>
        <Icon size={18} color={biya.gray} />
        {children}
      </div>
    </div>
  );
}

function DestOption({ active, onClick, icon: Icon, title, sub }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ size?: number; color?: string }>; title: string; sub: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 rounded-2xl px-4 py-4 text-left transition-all" style={{ backgroundColor: active ? biya.peach : "#fff", border: `2px solid ${active ? biya.marigold : biya.line}` }}>
      <span className="flex items-center justify-center rounded-xl" style={{ width: 42, height: 42, backgroundColor: active ? biya.marigold : biya.mute }}>
        <Icon size={20} color={active ? biya.goldDeep : biya.gray} />
      </span>
      <div className="flex-1">
        <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: biya.ink }}>{title}</p>
        <p style={{ fontFamily: font.display, fontSize: 12, color: biya.gray }}>{sub}</p>
      </div>
      <span className="flex items-center justify-center rounded-full" style={{ width: 22, height: 22, border: `2px solid ${active ? biya.marigold : biya.muteDeep}`, backgroundColor: active ? biya.marigold : "transparent" }}>
        {active && <Check size={13} color={biya.goldDeep} strokeWidth={3} />}
      </span>
    </button>
  );
}
