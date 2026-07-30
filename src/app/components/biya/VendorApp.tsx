import { useEffect, useState } from "react";
import { BottomNav, vendorNav } from "./BottomNav";
import { VendorOnboarding } from "./vendor/VendorOnboarding";
import { VendorDashboard } from "./vendor/VendorDashboard";
import { VendorCode } from "./vendor/VendorCode";
import { VendorSettlements } from "./vendor/VendorSettlements";
import { ArrowLeftRight, LogOut } from "lucide-react";
import { biya, font } from "./theme";
import { supabase } from "../../../lib/supabase";
import { buildSettlements, isVendorFullyOnboarded } from "./demoData";
import type { VendorProfile, VendorTxnRow } from "./data";

export function VendorApp({ userId, onLogout }: { userId: string; onLogout: () => void }) {
  const [loading, setLoading] = useState(true);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [txns, setTxns] = useState<VendorTxnRow[]>([]);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    let cancelled = false;

    const loadVendor = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, name, details")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setVendorProfile(null);
        setLoading(false);
        return;
      }

      if (isVendorFullyOnboarded(data.details)) {
        setVendorProfile({
          id: data.id,
          name: data.name,
          details: data.details,
        });
      } else {
        setVendorProfile(null);
      }
      setLoading(false);
    };

    loadVendor();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!vendorProfile) return;
    let cancelled = false;

    const loadTransactions = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, created_at, sender_id")
        .eq("receiver_id", userId)
        .order("created_at", { ascending: false });

      if (cancelled || error || !data) return;

      const senderIds = Array.from(new Set(data.map((r: any) => r.sender_id).filter(Boolean)));
      let usersMap: Record<string, string> = {};
      if (senderIds.length > 0) {
        const { data: usersData } = await supabase.from("users").select("id, name").in("id", senderIds);
        if (usersData) {
          usersMap = Object.fromEntries(usersData.map((u: any) => [u.id, u.name]));
        }
      }

      setTxns(data.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        created_at: row.created_at,
        senderName: usersMap[row.sender_id] || "Student"
      })));
    };

    loadTransactions();
    const iv = setInterval(loadTransactions, 3000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [userId, vendorProfile]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: biya.cream }}>
        <span style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: "1px", color: biya.gray }}>LOADING VENDOR...</span>
      </div>
    );
  }

  if (!vendorProfile) {
    return <VendorOnboarding userId={userId} onSaved={setVendorProfile} />;
  }

  const settlements = buildSettlements(txns, vendorProfile.details.payoutLabel);

  return (
    <div className="h-full relative">
      {tab === "dashboard" && (
        <VendorDashboard
          vendorName={vendorProfile.name}
          payoutLabel={vendorProfile.details.payoutLabel}
          payoutType={vendorProfile.details.payoutType}
          feed={txns}
          onNavigateToCode={() => setTab("code")}
        />
      )}
      {tab === "code" && <VendorCode vendorProfile={vendorProfile} />}
      {tab === "settlements" && <VendorSettlements settlements={settlements} />}

      {/* Log out / Switch back */}
      <div className="absolute top-6 right-6 flex gap-3">
        <button

          onClick={onLogout}
          className="flex items-center justify-center rounded-full bg-white transition-transform active:scale-95"
          style={{ width: 32, height: 32, border: `1.5px solid ${biya.line}` }}
        >
          <LogOut size={14} color={biya.ink} />
        </button>
      </div>

      <BottomNav items={vendorNav} active={tab} onChange={setTab} />
    </div>
  );
}
