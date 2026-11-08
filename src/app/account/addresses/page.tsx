import type { Metadata } from "next";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { AddressManager } from "@/components/account/AddressManager";

export const metadata: Metadata = { title: "My addresses" };

export default function AccountAddressesPage() {
  return <RequireDemoSession allowSignedIn><AddressManager /></RequireDemoSession>;
}
