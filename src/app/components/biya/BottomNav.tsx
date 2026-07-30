import { Home, Clock, User, LayoutGrid, QrCode, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { biya, font } from "./theme";

export type NavItem = { key: string; label: string; icon: LucideIcon };

export const studentNav: NavItem[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "history", label: "History", icon: Clock },
  { key: "profile", label: "Profile", icon: User },
];

export const vendorNav: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "code", label: "My Code", icon: QrCode },
  { key: "settlements", label: "Payouts", icon: Wallet },
];

export function BottomNav({ items, active, onChange }: { items: NavItem[]; active: string; onChange: (k: string) => void }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center justify-around bg-white px-4 pt-3 pb-8"
      style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: "0px -4px 20px rgba(0,0,0,0.04)" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const on = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className="flex flex-col items-center gap-1 rounded-full transition-colors"
            style={{ backgroundColor: on ? biya.marigold : "transparent", padding: on ? "8px 22px" : "8px" }}
          >
            <Icon size={18} color={on ? biya.goldDeep : biya.gray} />
            <span style={{ fontFamily: font.mono, fontSize: 10, fontWeight: 600, color: on ? biya.goldDeep : biya.gray }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
