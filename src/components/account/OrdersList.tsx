"use client";

import Link from "next/link";
import { CircleAlert, Package } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { OrderCard } from "@/components/account/OrderCard";
import { MessageState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/context/OrdersContext";

// The signed-in customer's orders from their account, newest first. States: a skeleton while they load,
// an error with a retry when the load fails, an empty state, and the list.
export function OrdersList() {
  const { orders, hydrated, loadError, reload } = useOrders();

  return (
    <div className="space-y-5">
      <AccountPageHeader
        title="My Orders"
        description="Your Cash on Delivery orders, newest first."
      />
      {loadError && (
        <p role="alert" className="flex flex-wrap items-center gap-2 rounded-2xl border border-destructive/30 bg-card p-3 text-sm text-destructive">
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          {loadError}
          <Button variant="outline" onClick={() => void reload()}>Try again</Button>
        </p>
      )}
      {!hydrated ? (
        <ul role="status" aria-label="Loading your orders" className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <li key={i} aria-hidden="true" className="surface-card space-y-3 rounded-2xl p-4 sm:p-5">
              <div className="h-4 w-48 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
              <div className="h-3 w-2/3 rounded-full bg-muted" />
              <div className="h-9 w-32 rounded-full bg-muted" />
            </li>
          ))}
        </ul>
      ) : orders.length === 0 ? (
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
