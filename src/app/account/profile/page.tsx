import type { Metadata } from "next";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { ProfileView } from "@/components/account/ProfileView";

export const metadata: Metadata = { title: "My profile (demo)" };

export default function ProfilePage() {
  return <RequireDemoSession><ProfileView /></RequireDemoSession>;
}
