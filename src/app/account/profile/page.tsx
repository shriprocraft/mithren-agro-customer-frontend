import type { Metadata } from "next";
import { RequireSignIn } from "@/components/account/RequireSignIn";
import { AccountProfileView } from "@/components/account/AccountProfileView";

export const metadata: Metadata = { title: "My profile" };

export default function Page() {
  return <RequireSignIn><AccountProfileView /></RequireSignIn>;
}
