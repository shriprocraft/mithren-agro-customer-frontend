import type { Metadata } from "next";
import { RequireSignIn } from "@/components/account/RequireSignIn";
import { TrackOrders } from "@/components/account/TrackOrders";

export const metadata: Metadata = { title: "Track orders" };

export default function Page() {
  return <RequireSignIn><TrackOrders /></RequireSignIn>;
}
