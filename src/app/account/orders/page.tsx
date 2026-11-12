import type { Metadata } from "next";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { ordersLive } from "@/services/orders";
import { OrdersList } from "@/components/account/OrdersList";

export const metadata: Metadata = { title: ordersLive ? "My orders" : "My orders (demo)" };

export default function AccountOrdersPage() {
  return <RequireDemoSession allowSignedIn={ordersLive}><OrdersList /></RequireDemoSession>;
}
