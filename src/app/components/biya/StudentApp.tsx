import { useState, useEffect } from "react";
import { biya, font } from "./theme";
import { BottomNav, studentNav } from "./BottomNav";
import { StudentHome } from "./student/StudentHome";
import { ScanToPay } from "./student/ScanToPay";
import { ConfirmPayment } from "./student/ConfirmPayment";
import { PinEntry } from "./student/PinEntry";
import { PaymentSuccess } from "./student/PaymentSuccess";
import { PaymentFailed } from "./student/PaymentFailed";
import { TransactionHistory } from "./student/TransactionHistory";
import { StudentProfile } from "./student/StudentProfile";
import { type Txn, type Vendor, vendorIcons } from "./data";
import { normalizeVendorCode } from "./demoData";
import { StudentOnboarding } from "./student/StudentOnboarding";
import { supabase } from "../../../lib/supabase";

type Screen = "tabs" | "scan" | "confirm" | "pin" | "success" | "failed";

function randomRef() {
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  return `0x${hex()}${hex()}…${hex()}${hex()}`;
}

export function StudentApp({ userId, onLogout }: { userId: string; onLogout: () => void }) {
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState<Screen>("tabs");
  const [scanStartManual, setScanStartManual] = useState(false);
  const [balance, setBalance] = useState(0);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [pinHash, setPinHash] = useState<string>("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pending, setPending] = useState<{ vendor: Vendor; amount: number; ref: string } | null>(null);
  const [failReason, setFailReason] = useState("Insufficient funds");
  const [fullyOnboarded, setFullyOnboarded] = useState<boolean | null>(null);

  async function loadStudentBalance(id: string) {
    const { data, error } = await supabase.from("users").select("balance").eq("id", id).maybeSingle();
    if (!error && data) setBalance(data.balance);
  }

  async function loadVendors() {
    const { data, error } = await supabase.from("users").select("*").eq("type", "vendor");
    if (error || !data) return;
    setVendors(
      data
        .map((v: any) => {
          const rawCode = v.details?.code ?? "";
          return {
            id: v.id,
            name: v.name,
            code: normalizeVendorCode(rawCode.toString(), false),
            campus: v.details?.campus || "ABU Samaru Campus",
            icon: vendorIcons[v.name] ?? vendorIcons["Samaru Mart"],
          };
        })
        .filter((vendor) => vendor.code.length === 10)
    );
  }

  async function loadTransactions(id: string) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("sender_id", id)
      .order("created_at", { ascending: false });
    if (error || !data) return;

    const { data: vData } = await supabase.from("users").select("id, name").eq("type", "vendor");
    const vMap = Object.fromEntries((vData || []).map((v: any) => [v.id, v.name]));
    setTxns(
      data.map((t: any) => ({
        id: t.id,
        vendor: vMap[t.receiver_id] || t.receiver_id,
        amount: t.amount,
        ts: t.created_at,
        status: t.status as any,
        ref: t.reference,
      }))
    );
  }

  useEffect(() => {
    async function loadProfile(id: string) {
      const { data, error } = await supabase.from("users").select("name, details").eq("id", id).maybeSingle();
      if (!error && data) {
        setUserName(data.name || "");
        setPinHash(data.details?.pinHash || "");
        if (data.name && data.details?.pinHash) {
          setFullyOnboarded(true);
        } else {
          setFullyOnboarded(false);
        }
      } else {
        setFullyOnboarded(false);
      }
    }
    loadStudentBalance(userId);
    loadVendors();
    loadTransactions(userId);
    loadProfile(userId);
    
    // Polling for updates
    const iv = setInterval(() => {
      loadStudentBalance(userId);
      loadTransactions(userId);
      loadVendors();
      loadProfile(userId);
    }, 5000);
    return () => clearInterval(iv);
  }, [userId]);

  useEffect(() => {
    if (screen === "scan") {
      loadVendors();
    }
  }, [screen, userId]);

  const executePayment = async () => {
    if (!pending) return;
    if (pending.amount > balance) {
      setFailReason("Insufficient funds");
      setScreen("failed");
      return;
    }

    try {
      const { data, error } = await supabase.rpc("transfer_payment", {
        p_sender: userId,
        p_receiver: pending.vendor.id,
        p_amount: pending.amount,
        p_ref: pending.ref,
      });

      if (error) {
        // Map Postgres exceptions to user-friendly messages
        const msg = error.message ?? "";
        if (msg.includes("Insufficient funds")) {
          setFailReason("Insufficient funds");
        } else if (msg.includes("Vendor not found")) {
          setFailReason("Vendor could not be found. Please try again.");
        } else {
          setFailReason("Could not complete payment right now. Please try again.");
        }
        setScreen("failed");
        return;
      }

      await Promise.all([loadStudentBalance(userId), loadTransactions(userId)]);
      setScreen("success");
    } catch (error) {
      console.error(error);
      setFailReason("Could not complete payment right now. Please try again.");
      setScreen("failed");
    }
  };

  if (fullyOnboarded === null) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: biya.cream }}>
        <span style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: "1px", color: biya.gray }}>LOADING STUDENT...</span>
      </div>
    );
  }

  if (fullyOnboarded === false) {
    return <StudentOnboarding userId={userId} onSaved={() => setFullyOnboarded(true)} />;
  }

  if (screen === "scan") {
    return <ScanToPay vendors={vendors} startManual={scanStartManual} onClose={() => { setScanStartManual(false); setScreen("tabs"); }} onContinue={(vendor, amount) => { setPending({ vendor, amount, ref: randomRef() }); setScreen("confirm"); }} />;
  }
  if (screen === "confirm" && pending) {
    return <ConfirmPayment vendor={pending.vendor} amount={pending.amount} onConfirm={() => setScreen("pin")} onCancel={() => setScreen("tabs")} />;
  }
  if (screen === "pin" && pending) {
    return <PinEntry pinHash={pinHash} onConfirm={executePayment} onCancel={() => setScreen("confirm")} />;
  }
  if (screen === "success" && pending) {
    return <PaymentSuccess vendor={pending.vendor} amount={pending.amount} reference={pending.ref} onDone={() => { setPending(null); setScreen("tabs"); setTab("home"); }} />;
  }
  if (screen === "failed" && pending) {
    return <PaymentFailed vendor={pending.vendor} amount={pending.amount} reason={failReason} onRetry={() => setScreen("confirm")} onHome={() => { setPending(null); setScreen("tabs"); setTab("home"); }} />;
  }

  const openScan = (manual = false) => {
    if (!manual) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then((s) => s.getTracks().forEach((t) => t.stop()))
            .catch(() => {
              // ignore; ScanToPay will show fallback
            });
        }
      } catch (e) {
        // ignore; ScanToPay will show fallback
      }
    }
    setScanStartManual(manual);
    setScreen("scan");
  };

  return (
    <div className="h-full relative">
      {tab === "home" && <StudentHome name={userName} balance={balance} txns={txns} onScan={() => openScan(false)} onManual={() => openScan(true)} onViewAll={() => setTab("history")} />}
      {tab === "history" && <TransactionHistory txns={txns} />}
      {tab === "profile" && (
        <StudentProfile
          balance={balance}
          userId={userId}
          onLogout={onLogout}
          onBalanceRefresh={() => loadStudentBalance(userId)}
        />
      )}
      <BottomNav items={studentNav} active={tab} onChange={setTab} />
    </div>
  );
}
