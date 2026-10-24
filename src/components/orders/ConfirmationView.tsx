"use client";

import Link from "next/link";
import { CircleCheck, Truck } from "lucide-react";
import { OrderDetails, formatOrderTime } from "@/components/orders/OrderDetails";
import { OrderLookup } from "@/components/orders/OrderLookup";
import { Button } from "@/components/ui/button";
import { orderStatusLabels } from "@/lib/orders";

export function ConfirmationView({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <OrderLookup params={params}>
      {(order) => (
        <>
          <section aria-labelledby="confirmation-title" className="surface-card flex flex-col items-center rounded-3xl px-6 py-10 text-center">
            <CircleCheck className="size-14 text-success" aria-hidden="true" />
            <h1 id="confirmation-title" className="mt-4 font-heading text-2xl font-semibold sm:text-3xl">Order Placed Successfully</h1>
            <p className="mt-2 text-muted-foreground">Thank you. Your order has been saved.</p>
            <dl className="mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
              <div><dt className="text-muted-foreground">Order ID</dt><dd className="font-mono font-semibold">{order.id}</dd></div>
              <div><dt className="text-muted-foreground">Placed on</dt><dd className="font-medium">{formatOrderTime(order.created_at)}</dd></div>
              <div><dt className="text-muted-foreground">Status</dt><dd className="font-medium text-primary">{orderStatusLabels[order.status]}</dd></div>
            </dl>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild><Link href={`/orders/${order.id}/tracking`}><Truck aria-hidden="true" />Track order</Link></Button>
              <Button asChild variant="outline"><Link href="/products">Continue shopping</Link></Button>
            </div>
            <p className="mt-6 max-w-lg text-xs text-muted-foreground">
              Demo order: no payment was taken and no seller has been notified. It is saved in this browser only.
            </p>
          </section>
          <div className="mt-6"><OrderDetails order={order} /></div>
        </>
      )}
    </OrderLookup>
  );
}
