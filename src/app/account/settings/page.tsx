import type { Metadata } from "next";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { SettingsView } from "@/components/account/SettingsView";

export const metadata: Metadata = { title: "Account settings (demo)" };

export default function AccountSettingsPage() {
  return <RequireDemoSession><SettingsView /></RequireDemoSession>;
}
