import type { Metadata } from "next";
import { RequireSignIn } from "@/components/account/RequireSignIn";
import { AccountOrderView } from "@/components/account/AccountOrderView";

export const metadata: Metadata = { title: "Order details" };

// The order is fetched from the account on the client, so the params promise goes to a client component
// (read with use() inside the account layout's Suspense boundary), as on the other order pages.

export default function Page({ params }: PageProps<"/account/orders/[orderId]">) {
  return <RequireSignIn><AccountOrderView params={params} /></RequireSignIn>;
}
