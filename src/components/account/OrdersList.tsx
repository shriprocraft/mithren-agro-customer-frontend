"use client";

import Link from "next/link";
import { CircleAlert, Package } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { OrderCard } from "@/components/account/OrderCard";
import { MessageState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/context/OrdersContext";
import { useStorageAvailable } from "@/hooks/usePersistentState";

// Every order saved in this browser, newest first: the demo account's sample orders (labelled) and
// any order placed through checkout. States: a skeleton until saved orders are read, an empty state,
// the list, and a warning when this browser blocks site storage (orders from this visit still show,
// but they cannot be kept).
export function OrdersList() {
  const { orders, hydrated } = useOrders();
  const storageAvailable = useStorageAvailable();
  const sampleCount = orders.filter((o) => o.is_sample).length;

  return (
    <div className="space-y-5">
      <AccountPageHeader
        title="My Orders"
        description={sampleCount > 0 ? "Orders marked “Sample order” are demonstration data, not real purchases." : "Orders placed in this browser."}
      />
      {!storageAvailable && (
        <p role="alert" className="flex gap-2 rounded-2xl border border-destructive/30 bg-card p-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          We can’t read orders saved in this browser because site storage is blocked. Orders placed during this visit are shown, but they will
          be lost when you close the tab. Allow site data for this site and reload to keep them.
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
