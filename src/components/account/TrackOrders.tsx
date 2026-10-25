"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Truck } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { OrderStatusBadge, itemsSummary } from "@/components/account/OrderCard";
import { TextField } from "@/components/account/TextField";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/context/OrdersContext";

// Orders still on their way, plus a lookup by order ID. Only orders saved in this browser can be
// found: there is no order service to ask.
export function TrackOrders() {
  const router = useRouter();
  const { orders, getOrder } = useOrders();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | undefined>();
  const active = orders.filter((o) => o.status !== "delivered");

  const find = (event: FormEvent) => {
    event.preventDefault();
    const id = query.trim().toUpperCase();
    if (!id) return setError("Enter an order ID, such as MA-20261025-7K3QX9");
    if (!getOrder(id)) return setError("No order with that ID is saved in this browser.");
    setError(undefined);
    router.push(`/orders/${id}/tracking`);
  };

  return (
    <div className="space-y-6">
      <AccountPageHeader title="Track Orders" description="Tracking is simulated in this preview: no delivery partner is connected." />

      <form onSubmit={find} noValidate className="surface-card flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-start sm:p-6">
        <TextField name="order_id" label="Order ID" value={query} onChange={(v) => { setQuery(v); setError(undefined); }} error={error} autoComplete="off" className="flex-1" />
        <Button type="submit" className="sm:mt-7"><Search aria-hidden="true" />Find order</Button>
      </form>

      <section aria-labelledby="active-title">
        <h2 id="active-title" className="font-heading text-lg font-semibold">On the way</h2>
        {active.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No orders in progress. Delivered orders are listed in <Link href="/account/orders" className="font-medium text-primary underline-offset-4 hover:underline">My Orders</Link>.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {active.map((order) => (
              <li key={order.id} className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold break-all">{order.id}</span>
                    <OrderStatusBadge order={order} />
                    {order.is_sample && <span className="text-xs text-muted-foreground">Sample</span>}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{itemsSummary(order, 1)}</p>
                </div>
                <Button asChild variant="secondary"><Link href={`/orders/${order.id}/tracking`}><Truck aria-hidden="true" />Track<span className="sr-only"> order {order.id}</span></Link></Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
