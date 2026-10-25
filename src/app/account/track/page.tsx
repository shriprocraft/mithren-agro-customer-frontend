import type { Metadata } from "next";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { TrackOrders } from "@/components/account/TrackOrders";

export const metadata: Metadata = { title: "Track orders (demo)" };

export default function TrackOrdersPage() {
  return <RequireDemoSession><TrackOrders /></RequireDemoSession>;
}
