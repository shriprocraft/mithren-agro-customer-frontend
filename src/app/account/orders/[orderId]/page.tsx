import type { Metadata } from "next";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { AccountOrderView } from "@/components/account/AccountOrderView";

export const metadata: Metadata = { title: "Order details (demo)" };

// The order lives in browser storage, so the params promise goes to a client component (read with
// use() inside the account layout's Suspense boundary), as on the existing order pages.
export default function AccountOrderPage({ params }: PageProps<"/account/orders/[orderId]">) {
  return <RequireDemoSession><AccountOrderView params={params} /></RequireDemoSession>;
}
