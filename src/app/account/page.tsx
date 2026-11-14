import type { Metadata } from "next";
import { RequireSignIn } from "@/components/account/RequireSignIn";
import { AccountOverview } from "@/components/account/AccountOverview";

export const metadata: Metadata = { title: "Your account" };

export default function Page() {
  return <RequireSignIn><AccountOverview /></RequireSignIn>;
}
