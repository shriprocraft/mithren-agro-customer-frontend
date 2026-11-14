import type { Metadata } from "next";
import { RequireSignIn } from "@/components/account/RequireSignIn";
import { AddressManager } from "@/components/account/AddressManager";

export const metadata: Metadata = { title: "My addresses" };

export default function Page() {
  return <RequireSignIn><AddressManager /></RequireSignIn>;
}
