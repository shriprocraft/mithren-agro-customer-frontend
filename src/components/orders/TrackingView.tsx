"use client";

import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { OrderDetails, formatOrderTime } from "@/components/orders/OrderDetails";
import { OrderLookup } from "@/components/orders/OrderLookup";
import { TrackingTimeline } from "@/components/orders/TrackingTimeline";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useOrders } from "@/context/OrdersContext";
import { nextStatus, orderStatusLabels } from "@/lib/orders";
import type { Order } from "@/types/order";

// Demo-only status controls exist because there is no delivery backend. They are compiled out of
// production builds unless NEXT_PUBLIC_DEMO_TOOLS=true is set deliberately (docs/ARCHITECTURE.md).
const DEMO_TOOLS = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEMO_TOOLS === "true";

export function TrackingView({ params }: { params: Promise<{ orderId: string }> }) {
  return <OrderLookup params={params}>{(order) => <Tracking order={order} />}</OrderLookup>;
}

function Tracking({ order }: { order: Order }) {
  const { advance } = useOrders();
  const announce = useAnnounce();
  const next = nextStatus(order.status);

  return (
    <>
      <section aria-labelledby="tracking-title" className="surface-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 id="tracking-title" className="font-heading text-2xl font-semibold">Track your order</h1>
            <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
              <div><dt className="text-muted-foreground">Order ID</dt><dd className="font-mono font-semibold">{order.id}</dd></div>
              <div><dt className="text-muted-foreground">Placed on</dt><dd className="font-medium">{formatOrderTime(order.created_at)}</dd></div>
              <div><dt className="text-muted-foreground">Current status</dt><dd className="font-medium text-primary">{orderStatusLabels[order.status]}</dd></div>
            </dl>
          </div>
          <Button asChild variant="outline"><Link href={`/orders/${order.id}/confirmation`}>Order confirmation</Link></Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {order.is_sample && <span className="mr-2 rounded-full border border-border px-2 py-0.5 text-xs font-medium">Sample order</span>}
          Simulated tracking. Estimated delivery: not available. No delivery partner is connected in this preview.
        </p>
        <div className="mt-8">
          <TrackingTimeline order={order} />
        </div>
      </section>

      {DEMO_TOOLS && (
        <section aria-labelledby="demo-tools-title" className="mt-6 rounded-3xl border-2 border-dashed border-border p-5">
          <h2 id="demo-tools-title" className="flex items-center gap-2 font-heading text-base font-semibold">
            <FlaskConical className="size-4" aria-hidden="true" /> Demo tools (development only)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Simulates the seller and delivery updates a real backend would send. Hidden from customers in production builds.
          </p>
          <Button
            variant="secondary"
            className="mt-3"
            disabled={!next}
            onClick={() => {
              advance(order.id);
              if (next) announce(`Order status changed to ${orderStatusLabels[next]}.`);
            }}
          >
            {next ? `Move to “${orderStatusLabels[next]}”` : "Order delivered"}
          </Button>
        </section>
      )}

      <div className="mt-6"><OrderDetails order={order} /></div>
      <div className="mt-6">
        <Button asChild variant="outline"><Link href="/products">Continue shopping</Link></Button>
      </div>
    </>
  );
}
