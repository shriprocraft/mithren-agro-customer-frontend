import type { Metadata } from "next";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { OrdersList } from "@/components/account/OrdersList";

export const metadata: Metadata = { title: "My orders (demo)" };

export default function AccountOrdersPage() {
  return <RequireDemoSession><OrdersList /></RequireDemoSession>;
}
