import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, MapPin, Lock, Check, ArrowRight, Building2 } from "lucide-react";
import { biya, font } from "../theme";
import { supabase } from "../../../../lib/supabase";
import { hashPin } from "../../../../lib/hash";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "transparent", outline: "none", border: "none",
  fontFamily: font.display, fontSize: 16, color: biya.ink,
};

export function StudentOnboarding({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [step, setStep] = useState(0);
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [clevaId, setClevaId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canNext =
    step === 0 ? pin.length === 4 :
    step === 1 ? name.trim().length > 1 && location.trim().length > 1 :
    step === 2 ? !saving && clevaId.trim().length > 1 :
    true;

  const saveProfile = async () => {
    setSaving(true);
    setError("");

    try {
      const pinHash = await hashPin(pin);
      
      const { data: user } = await supabase.from("users").select("details").eq("id", userId).single();
      const existingDetails = user?.details || {};

      const details = {
        ...existingDetails,
        pinHash,
        location: location.trim(),
        clevaId: clevaId.trim(),
      };

      const { error: saveError } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          details,
        })
        .eq("id", userId);

      if (saveError) throw saveError;
      
      onSaved();
    } catch (err) {
      console.error(err);
      setError("Could not save profile. Please try again.");
      setSaving(false);
    }
  };

  const next = () => {
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    saveProfile();
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: biya.cream }}>
      <header className="px-6 pt-8 pb-4">
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
                <Lock size={26} color={biya.gold} />
              </span>
              <h1 style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: biya.ink }}>Create a PIN</h1>
              <p className="mb-6" style={{ fontFamily: font.display, fontSize: 15, color: biya.gray }}>This 4-digit PIN secures your payments.</p>

              <Field label="4-DIGIT PIN" icon={Lock}>
                <input 
                  value={pin} 
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} 
                  placeholder="0000" 
                  type="password"
                  inputMode="numeric"
                  style={{ ...inputStyle, letterSpacing: "4px" }} 
                />
              </Field>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: biya.ink }}>Your details</h1>
              <p className="mb-6" style={{ fontFamily: font.display, fontSize: 15, color: biya.gray }}>Tell us a bit about yourself.</p>

              <Field label="FULL NAME" icon={User}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Musa Ibrahim" style={inputStyle} />
              </Field>
              <Field label="CAMPUS LOCATION" icon={MapPin}>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. ABU Samaru Campus" style={inputStyle} />
              </Field>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: biya.ink }}>Link your wallet</h1>
              <p className="mb-6" style={{ fontFamily: font.display, fontSize: 15, color: biya.gray }}>Link your Cleva account to fund your Biya wallet.</p>

              <Field label="CLEVA ACCOUNT ID (TAG)" icon={Building2}>
                <input value={clevaId} onChange={(e) => setClevaId(e.target.value)} placeholder="@musa" style={inputStyle} />
              </Field>
              
              <div className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: "rgba(254,174,44,0.15)" }}>
                <p style={{ fontFamily: font.display, fontSize: 13, color: biya.ink, lineHeight: 1.5 }}>
                  <strong>Note:</strong> Since this is a prototype, we won't actually charge your Cleva account. Your Biya wallet will be pre-funded with ₦0 for testing.
                </p>
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

      <div className="px-6 pb-10 pt-4">
        <button
          onClick={next}
          disabled={!canNext}
          className="w-full flex items-center justify-center gap-2 rounded-full transition-transform active:scale-[0.98]"
          style={{ height: 56, backgroundColor: canNext ? biya.marigold : biya.muteDeep, opacity: canNext ? 1 : 0.6 }}
        >
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: canNext ? biya.goldDeep : biya.gray }}>
            {step === 2 ? (saving ? "Saving..." : "Done, start paying") : "Continue"}
          </span>
          {step === 2 ? <Check size={18} color={biya.goldDeep} /> : <ArrowRight size={18} color={canNext ? biya.goldDeep : biya.gray} />}
        </button>
      </div>
    </div>
  );
}



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
