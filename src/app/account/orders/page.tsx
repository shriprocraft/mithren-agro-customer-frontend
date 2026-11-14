import type { Metadata } from "next";
import { RequireSignIn } from "@/components/account/RequireSignIn";
import { OrdersList } from "@/components/account/OrdersList";

export const metadata: Metadata = { title: "My orders" };

export default function Page() {
  return <RequireSignIn><OrdersList /></RequireSignIn>;
}
