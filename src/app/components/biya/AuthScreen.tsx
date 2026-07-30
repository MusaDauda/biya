import React, { useState } from "react";
import { ArrowRight, GraduationCap, Store, Mail, Lock } from "lucide-react";
import { biya, font } from "./theme";
import { supabase } from "../../../lib/supabase";
import { hashPin } from "../../../lib/hash";

export function AuthScreen({ role, onAuth, onBack }: { role: "student" | "vendor"; onAuth: (id: string) => void; onBack: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 4) return;
    
    setLoading(true);
    setError("");
    const userId = email.trim().toLowerCase();

    try {
      if (isLogin) {
        // Handle Login
        const { data, error: lookupError } = await supabase
          .from("users")
          .select("id, type, details")
          .eq("id", userId)
          .maybeSingle();
          
        if (lookupError) throw lookupError;
        if (!data) {
          setError("Account not found. Please sign up.");
          setLoading(false);
          return;
        }
        if (data.type !== role) {
          setError(`This email is registered as a ${data.type}.`);
          setLoading(false);
          return;
        }

        const passHash = await hashPin(password);
        if (data.details?.passwordHash !== passHash) {
          if (data.details?.passwordHash) {
            setError("Incorrect password.");
            setLoading(false);
            return;
          } else {
            await supabase.from("users").update({ details: { ...data.details, passwordHash: passHash } }).eq("id", userId);
          }
        }
        
        onAuth(userId);
      } else {
        // Handle Signup
        const { data } = await supabase.from("users").select("id").eq("id", userId).maybeSingle();
        if (data) {
          setError("Email already in use. Please log in.");
          setLoading(false);
          return;
        }
        
        const passwordHash = await hashPin(password);
        const { error: createError } = await supabase.from("users").insert({
          id: userId,
          type: role,
          name: "", // Will be filled in Onboarding
          balance: 0,
          details: { passwordHash },
        });
        
        if (createError) throw createError;
        onAuth(userId);
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Check your connection.");
      setLoading(false);
    }
  };

  const Icon = role === "student" ? GraduationCap : Store;

  return (
    <div className="h-full flex flex-col justify-between px-7 py-14" style={{ background: "linear-gradient(160deg, #000218 0%, #141b3c 60%, #1c2450 100%)", overflowY: "auto" }}>
      <div>
        <button onClick={onBack} className="mb-8 flex items-center gap-2 rounded-full px-4 py-2 transition-transform active:scale-95" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
          <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 600, color: "#fff", letterSpacing: "1px" }}>BACK</span>
        </button>
        
        <span className="flex items-center justify-center rounded-3xl mb-5" style={{ width: 64, height: 64, backgroundColor: biya.marigold }}>
          <Icon size={32} color={biya.goldDeep} />
        </span>
        
        <h1 style={{ fontFamily: font.display, fontWeight: 800, fontSize: 36, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {isLogin ? "Welcome back" : "Create account"}
        </h1>
        <p className="mt-3" style={{ fontFamily: font.display, fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
          {role === "student" ? "Sign in to start paying on campus." : "Sign in to manage your stall."}
        </p>
      </div>

      <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 mt-8 flex-1 justify-center">
        <div className="flex items-center gap-3 rounded-[20px] px-5 py-4" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <Mail size={20} color={biya.marigold} />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            className="w-full bg-transparent outline-none"
            style={{ fontFamily: font.display, fontSize: 17, color: "#fff" }}
          />
        </div>
        
        <div className="flex items-center gap-3 rounded-[20px] px-5 py-4" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <Lock size={20} color={biya.marigold} />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full bg-transparent outline-none"
            style={{ fontFamily: font.display, fontSize: 17, color: "#fff" }}
          />
        </div>
        {error && <p style={{ fontFamily: font.display, fontSize: 13, color: "#ffb4ab" }}>{error}</p>}

        <button 
          disabled={loading || !email.trim() || password.length < 4}
          type="submit" 
          className="mt-6 flex items-center justify-center gap-2 rounded-full px-7 py-4 transition-transform active:scale-95 disabled:opacity-50" 
          style={{ backgroundColor: biya.marigold }}
        >
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: biya.goldDeep }}>
            {loading ? "Please wait..." : (isLogin ? "Log In" : "Continue")}
          </span>
          {!loading && <ArrowRight size={19} color={biya.goldDeep} />}
        </button>
        
        <button type="button" onClick={() => setIsLogin(!isLogin)} className="mt-4 text-center">
          <span style={{ fontFamily: font.display, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </span>
        </button>
      </form>
    </div>
  );
}
