import type { Metadata } from "next";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { AddressManager } from "@/components/account/AddressManager";

export const metadata: Metadata = { title: "My addresses (demo)" };

export default function AccountAddressesPage() {
  return <RequireDemoSession><AddressManager /></RequireDemoSession>;
}
