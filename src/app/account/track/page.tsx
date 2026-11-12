import type { Metadata } from "next";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { ordersLive } from "@/services/orders";
import { TrackOrders } from "@/components/account/TrackOrders";

export const metadata: Metadata = { title: ordersLive ? "Track orders" : "Track orders (demo)" };

export default function TrackOrdersPage() {
  return <RequireDemoSession allowSignedIn={ordersLive}><TrackOrders /></RequireDemoSession>;
}
