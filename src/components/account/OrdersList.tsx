"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { OrderCard } from "@/components/account/OrderCard";
import { MessageState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/context/OrdersContext";

// Every order saved in this browser, newest first: the demo account's sample orders (labelled) and
// any order placed through checkout.
export function OrdersList() {
  const { orders } = useOrders();
  const sampleCount = orders.filter((o) => o.is_sample).length;

  return (
    <div className="space-y-5">
      <AccountPageHeader
        title="My Orders"
        description={sampleCount > 0 ? "Orders marked “Sample order” are demonstration data, not real purchases." : "Orders placed in this browser."}
      />
      {orders.length === 0 ? (
        <MessageState icon={Package} title="No orders yet" actions={<Button asChild><Link href="/products">Start shopping</Link></Button>}>
          When you place an order it appears here, with its status and tracking.
        </MessageState>
      ) : (
        <ul className="grid gap-3">
          {orders.map((order) => <li key={order.id}><OrderCard order={order} /></li>)}
        </ul>
      )}
    </div>
  );
}
