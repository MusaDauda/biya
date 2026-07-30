import { Utensils, Printer, Bike, BookOpen, Coffee, ShoppingBag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { VendorDetails } from "./demoData";

export type Vendor = { id: string; name: string; code: string; campus: string; icon: LucideIcon };
export type VendorProfile = { id: string; name: string; details: VendorDetails };

export const vendorIcons: Record<string, LucideIcon> = {
  "Iya Basira Food": Utensils,
  "Campus Print": Printer,
  "Hostel Gate Bike": Bike,
  "Book Hub": BookOpen,
  "Campus Cafe": Coffee,
  "Samaru Mart": ShoppingBag,
};

export type Txn = { id: string; vendor: string; amount: number; ts: number; status: "completed" | "settling"; ref: string };
export type VendorTxn = { id: string; amount: number; ts: number };
export type VendorTxnRow = { id: string; amount: number; created_at: number; senderName?: string; };

const DAY = 86400000;
export { DAY };
