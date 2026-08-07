import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { PhoneFrame } from "./components/biya/primitives";
import { Landing, Splash } from "./components/biya/Landing";
import { Welcome } from "./components/biya/Welcome";
import { AuthScreen } from "./components/biya/AuthScreen";
import { Onboarding } from "./components/biya/Onboarding";
import { BiyaApp } from "./components/biya/BiyaApp";
import { biya, font } from "./components/biya/theme";
import { Toaster } from "./components/ui/sonner";
import { clearSession, getMe, onboardingStep, storedUserId, type Me } from "../lib/api";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, background: "#ffb4ab", color: "#93000a", fontFamily: "monospace", height: "100vh", overflow: "auto" }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.error.toString()}</pre>
          <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// There is no role here any more. A person is a person: they can pay and they
// can be paid. Whether they sell anything is one boolean on their record, not a
// fork in the application.
// The entry flow:
//
//   resolving -> landing -> splash -> welcome -> auth -> onboarding -> app
//
// A stored session skips straight from the splash to the app. `landing` is the
// marketing page, which a new visitor sees first; `welcome` is the in-app hero
// that offers the two ways in.
type Stage = "resolving" | "landing" | "splash" | "welcome" | "auth" | "app";

const SPLASH_MS = 1400;

function InnerApp() {
  const [stage, setStage] = useState<Stage>("resolving");
  const [user, setUser] = useState<Me | null>(null);
  const [intent, setIntent] = useState<"signup" | "login">("signup");
  // Decided once, when the account arrives. It cannot be derived on every
  // render: setting the PIN completes the last required field, which would
  // otherwise tear the tier summary and the business question off the end of
  // the flow the moment the PIN lands.
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const arrive = (me: Me) => {
    setUser(me);
    setNeedsOnboarding(onboardingStep(me) !== "done");
    setStage("app");
  };

  // Resolve the stored session once. Someone already signed in never sees the
  // marketing page: they get the splash and then their account.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = storedUserId();
      if (!id) {
        if (!cancelled) setStage("landing");
        return;
      }
      const me = await getMe(id);
      if (cancelled) return;
      if (!me) {
        clearSession();
        setStage("landing");
        return;
      }
      setStage("splash");
      setTimeout(() => { if (!cancelled) arrive(me); }, SPLASH_MS);
    })();
    return () => { cancelled = true; };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const logout = () => {
    clearSession();
    setUser(null);
    setStage("landing");
  };

  const enter = (which: "signup" | "login") => {
    setIntent(which);
    setStage("splash");
    setTimeout(() => setStage("welcome"), SPLASH_MS);
  };

  if (stage === "resolving" || stage === "splash") {
    return <PhoneFrame><Splash /></PhoneFrame>;
  }

  // The marketing page is the public web page, not an app screen, so it is not
  // inside the phone frame. Everything from the splash onward is.
  if (stage === "landing") {
    return <Landing onEnter={enter} />;
  }

  if (stage === "welcome") {
    return (
      <PhoneFrame>
        <Welcome
          user={user}
          onSignUp={() => { setIntent("signup"); setStage("auth"); }}
          onLogIn={() => { setIntent("login"); setStage("auth"); }}
        />
      </PhoneFrame>
    );
  }

  // Deliberately not AnimatePresence with mode="wait".
  //
  // That gates mounting the next screen on the previous one finishing its exit
  // animation, and exit animations run on requestAnimationFrame. On a phone
  // that locks, a backgrounded tab, or anywhere rAF is throttled, the exit
  // never completes and the app wedges on the screen you just left. A crossfade
  // is not worth a stuck signup.
  return (
    <PhoneFrame>
      {stage === "auth" && (
        <motion.div key="auth" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="h-full">
          <AuthScreen start={intent} onAuth={arrive} onBack={() => setStage("welcome")} />
        </motion.div>
      )}

      {stage === "app" && user && needsOnboarding && (
        <motion.div key="onboarding" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="h-full">
          <Onboarding
            user={user}
            onUser={setUser}
            onFinish={(u) => { setUser(u); setNeedsOnboarding(false); }}
          />
        </motion.div>
      )}

      {stage === "app" && user && !needsOnboarding && (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
          <BiyaApp user={user} onUserChanged={setUser} onLogout={logout} />
        </motion.div>
      )}

      <Toaster />
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
