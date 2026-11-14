"use client";

import Link from "next/link";
import { OrderDetails, formatOrderTime } from "@/components/orders/OrderDetails";
import { CancelOrder, orderNotice } from "@/components/orders/CancelOrder";
import { OrderLookup } from "@/components/orders/OrderLookup";
import { TrackingTimeline } from "@/components/orders/TrackingTimeline";
import { Button } from "@/components/ui/button";
import { orderStatusLabels } from "@/lib/orders";
import type { Order } from "@/types/order";

export function TrackingView({ params }: { params: Promise<{ orderId: string }> }) {
  return <OrderLookup params={params}>{(order) => <Tracking order={order} />}</OrderLookup>;
}

function Tracking({ order }: { order: Order }) {
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
          {order.status === "cancelled" ? orderNotice(order) : `${orderNotice(order)} Estimated delivery: not available yet.`}
        </p>
        <CancelOrder order={order} />
        <div className="mt-8">
          <TrackingTimeline order={order} />
        </div>
      </section>

      <div className="mt-6"><OrderDetails order={order} /></div>
      <div className="mt-6">
        <Button asChild variant="outline"><Link href="/products">Continue shopping</Link></Button>
      </div>
    </>
  );
}
