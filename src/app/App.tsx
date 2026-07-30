import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, Store, ArrowRight } from "lucide-react";
import { PhoneFrame } from "./components/biya/primitives";
import { StudentApp } from "./components/biya/StudentApp";
import { VendorApp } from "./components/biya/VendorApp";
import { Landing } from "./components/biya/Landing";
import { AuthScreen } from "./components/biya/AuthScreen";
import { biya, font } from "./components/biya/theme";
import { supabase } from "../lib/supabase";
import { Toaster } from "./components/ui/sonner";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: "#ffb4ab", color: "#93000a", fontFamily: "monospace", height: "100vh" }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

type Role = "landing" | "picker" | "student" | "vendor";

function InnerApp() {
  const savedRole = localStorage.getItem("biya_role") as Role | null;
  const savedUserId = localStorage.getItem("biya_user_id");
  const [role, setRole] = useState<Role>(
    savedRole && savedUserId && (savedRole === "student" || savedRole === "vendor")
      ? savedRole
      : "landing"
  );
  const [userId, setUserId] = useState<string | null>(savedUserId);
  const [sessionReady, setSessionReady] = useState(true);

  const handleAuth = (id: string) => {
    localStorage.setItem("biya_user_id", id);
    localStorage.setItem("biya_role", role);
    setUserId(id);
  };

  const logout = () => {
    localStorage.removeItem("biya_user_id");
    localStorage.removeItem("biya_role");
    setUserId(null);
    setRole("picker");
  };

  useEffect(() => {
    if (role !== "student" && role !== "vendor") {
      setSessionReady(true);
      return;
    }
    if (!userId) {
      setSessionReady(true);
      return;
    }

    let cancelled = false;
    setSessionReady(false);

    const validate = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("type")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data || data.type !== role) {
        localStorage.removeItem("biya_user_id");
        setUserId(null);
        setRole("picker");
      }
      setSessionReady(true);
    };

    validate();
    return () => {
      cancelled = true;
    };
  }, [role, userId]);

  if (role === "landing") {
    return <Landing onLaunch={(r) => { localStorage.setItem("biya_role", r); setRole(r); }} userId={userId} />;
  }

  return (
    <PhoneFrame>
      {!sessionReady ? (
        <div className="h-full flex items-center justify-center" style={{ background: "linear-gradient(160deg, #000218 0%, #141b3c 60%, #1c2450 100%)" }}>
          <span style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: "1px", color: "rgba(255,255,255,0.75)" }}>
            LOADING SESSION...
          </span>
        </div>
      ) : (
      <>
        <AnimatePresence mode="wait">
          {role === "picker" && (
          <motion.div
            key="picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col justify-between px-7 py-14"
            style={{ background: "linear-gradient(160deg, #000218 0%, #141b3c 60%, #1c2450 100%)" }}
          >
            <div>
              <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 40, color: biya.marigold, letterSpacing: "-0.02em" }}>Biya</span>
              <p className="mt-3" style={{ fontFamily: font.display, fontSize: 17, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
                USDT payments for campus.<br />Pay and get paid in seconds.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <span style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: "1px", color: "rgba(190,196,238,0.7)" }}>I AM A…</span>
              <RoleCard icon={GraduationCap} title="Student" sub="Scan and pay vendors" onClick={() => setRole("student")} />
              <RoleCard icon={Store} title="Vendor" sub="Accept Biya at your stall" onClick={() => setRole("vendor")} />
            </div>
          </motion.div>
        )}

        {role === "student" && !userId && (
          <motion.div key="auth-student" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="h-full">
            <AuthScreen role="student" onAuth={handleAuth} onBack={() => setRole("picker")} />
          </motion.div>
        )}

        {role === "student" && userId && (
          <motion.div key="student" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="h-full">
            <StudentApp userId={userId} onLogout={logout} />
          </motion.div>
        )}

        {role === "vendor" && !userId && (
          <motion.div key="auth-vendor" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="h-full">
            <AuthScreen role="vendor" onAuth={handleAuth} onBack={() => setRole("picker")} />
          </motion.div>
        )}

        {role === "vendor" && userId && (
          <motion.div key="vendor" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="h-full">
            <VendorApp userId={userId} onLogout={logout} />
          </motion.div>
        )}
        </AnimatePresence>
        <Toaster />
      </>
      )}
    </PhoneFrame>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <InnerApp />
    </ErrorBoundary>
  );
}

function RoleCard({ icon: Icon, title, sub, onClick }: { icon: React.ComponentType<{ size?: number; color?: string }>; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-[26px] px-5 py-5 text-left transition-transform active:scale-[0.98]"
      style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <span className="flex items-center justify-center rounded-2xl" style={{ width: 52, height: 52, backgroundColor: biya.marigold }}>
        <Icon size={26} color={biya.goldDeep} />
      </span>
      <span className="flex-1">
        <span className="block" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 19, color: "#fff" }}>{title}</span>
        <span className="block" style={{ fontFamily: font.display, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{sub}</span>
      </span>
      <ArrowRight size={20} color={biya.marigold} />
    </button>
  );
}
