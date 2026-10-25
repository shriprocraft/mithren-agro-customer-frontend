import type { Metadata } from "next";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { AccountOverview } from "@/components/account/AccountOverview";

export const metadata: Metadata = { title: "Your account (demo)" };

export default function AccountPage() {
  return <RequireDemoSession><AccountOverview /></RequireDemoSession>;
}
