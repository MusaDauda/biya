import { useState, useEffect } from "react";
import { Store, Shield, Bell, HelpCircle, LogOut, ChevronRight, Droplets } from "lucide-react";
import { biya, font, formatNaira, toUsdt } from "../theme";
import { supabase } from "../../../../lib/supabase";

export function StudentProfile({
  balance,
  userId,
  onLogout,
  onBalanceRefresh,
}: {
  balance: number;
  userId: string;
  onLogout: () => void;
  onBalanceRefresh?: () => Promise<void> | void;
}) {
  const [userName, setUserName] = useState("Loading...");
  const [location, setLocation] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase.from("users").select("name, details").eq("id", userId).single().then(({ data }) => {
      if (data) {
        setUserName(data.name);
        setLocation((data as any).details?.location || "");
      }
    });
  }, [userId]);

  const handleFaucet = async () => {
    setNotice("");
    try {
      const { data } = await supabase.from('users').select('balance').eq('id', userId).single();
      if (data) {
        await supabase.from('users').update({ balance: data.balance + 50000 }).eq('id', userId);
        await onBalanceRefresh?.();
        setNotice("50,000 NGN added to your balance.");
      }
    } catch (err) {
      console.error(err);
      setNotice("Failed to request test funds.");
    }
  };

  const rows = [
    { icon: Droplets, label: "Request test funds (Faucet)", action: handleFaucet },
    { icon: Shield, label: "Security & PIN" },
    { icon: Bell, label: "Notifications" },
    { icon: HelpCircle, label: "Help & support" },
  ];

  return (
    <div className="h-full overflow-y-auto pb-32" style={{ backgroundColor: biya.cream }}>
      <header className="px-6 pt-8 pb-4">
        <h1 style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, color: biya.ink }}>Profile</h1>
      </header>

      <div className="px-6">
        <div className="flex items-center gap-4 rounded-[28px] bg-white p-5" style={{ border: `1px solid ${biya.line}` }}>
          <span className="flex items-center justify-center rounded-full" style={{ width: 56, height: 56, backgroundColor: biya.peach }}>
            <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: biya.gold }}>{userName.charAt(0)}</span>
          </span>
          <div>
            <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 18, color: biya.ink }}>{userName}</p>
            {location && <p style={{ fontFamily: font.mono, fontSize: 12, color: biya.gray }}>{location}</p>}
          </div>
        </div>

        <div className="rounded-[24px] p-5 mt-4" style={{ background: "linear-gradient(135deg, #000218 0%, #141b3c 100%)" }}>
          <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "1px", color: "rgba(190,196,238,0.9)" }}>BALANCE</span>
          <p className="mt-1" style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 24, color: "#fff" }}>₦{formatNaira(balance, true)}</p>
          <p style={{ fontFamily: font.mono, fontSize: 12, color: biya.greenSoft }}>≈ {toUsdt(balance)} USDT</p>
        </div>

        {/* Switch to vendor */}
        <div className="rounded-[24px] bg-white overflow-hidden mt-4" style={{ border: `1px solid ${biya.line}` }}>
          {rows.map((r, i) => {
            const Icon = r.icon;
            return (
              <button 
                key={r.label} 
                onClick={r.action}
                className="w-full flex items-center justify-between px-5 py-4 transition-colors active:bg-gray-50" 
                style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(20,27,60,0.06)" : "none" }}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} color={biya.ink} />
                  <span style={{ fontFamily: font.display, fontSize: 15, color: biya.ink }}>{r.label}</span>
                </span>
                <ChevronRight size={18} color={biya.gray} />
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-sm" style={{ fontFamily: font.display, color: biya.gray }}>
          To use a vendor account, log out and sign in again as a vendor.
        </p>
        {notice && <p className="mt-3" style={{ fontFamily: font.display, fontSize: 13, color: notice.startsWith("Failed") ? biya.red : biya.greenText }}>{notice}</p>}

        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-4 mt-4 transition-opacity active:opacity-70">
          <LogOut size={16} color={biya.red} />
          <span style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.6px", color: biya.red }}>LOG OUT</span>
        </button>
      </div>
    </div>
  );
}
