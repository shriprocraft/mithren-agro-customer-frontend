import type { Metadata } from "next";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { AccountOverview } from "@/components/account/AccountOverview";
import { ordersLive } from "@/services/orders";

// With the backend, signed-in customers see their own account here; only the demo account is sample data.
export const metadata: Metadata = { title: ordersLive ? "Your account" : "Your account (demo)" };

export default function AccountPage() {
  return <RequireDemoSession allowSignedIn><AccountOverview /></RequireDemoSession>;
}
