"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical, PackageSearch, Truck } from "lucide-react";
import { OrderStatusBadge } from "@/components/account/OrderCard";
import { LoadingState, MessageState } from "@/components/checkout/PageState";
import { OrderDetails, formatOrderTime } from "@/components/orders/OrderDetails";
import { TrackingTimeline } from "@/components/orders/TrackingTimeline";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/context/OrdersContext";

// One order inside the account: summary, the simulated tracking timeline and the order contents.
// The full tracking page (/orders/[id]/tracking) is linked rather than duplicated.
export function AccountOrderView({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { getOrder, hydrated } = useOrders();
  if (!hydrated) return <LoadingState label="Loading your order…" fullHeight />;
  const order = getOrder(decodeURIComponent(orderId));

  const back = (
    <Link href="/account/orders" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" /> Back to my orders
    </Link>
  );

  if (!order) {
    return (
      <div className="space-y-3">
        {back}
        <MessageState icon={PackageSearch} title="We couldn’t find that order" actions={<Button asChild><Link href="/account/orders">View my orders</Link></Button>}>
          Check the order ID. Orders are saved in the browser they were placed in, so they can’t be opened from another device or after site data is cleared.
        </MessageState>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {back}
      <section aria-labelledby="order-title" className="surface-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 id="order-title" className="font-heading text-2xl font-semibold">Order details</h1>
            <p className="mt-1 font-mono text-sm font-semibold break-all">{order.id}</p>
            <p className="text-sm text-muted-foreground">Placed {formatOrderTime(order.created_at)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {order.is_sample && <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Sample order</span>}
            <OrderStatusBadge order={order} />
          </div>
        </div>
        <p className="mt-4 flex gap-2 rounded-2xl bg-secondary p-3 text-xs leading-relaxed text-secondary-foreground">
          <FlaskConical className="mt-px size-4 shrink-0" aria-hidden="true" />
          {order.is_sample
            ? "Sample order for the demo account. It was never placed or paid for, and its tracking is simulated."
            : "Demo order: no payment was taken and no seller or delivery partner was notified. Tracking is simulated."}
        </p>
        <h2 className="mt-6 font-heading text-base font-semibold">Simulated tracking</h2>
        <div className="mt-4"><TrackingTimeline order={order} /></div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild><Link href={`/orders/${order.id}/tracking`}><Truck aria-hidden="true" />Open tracking page</Link></Button>
          <Button asChild variant="outline"><Link href="/account/orders">Back to my orders</Link></Button>
        </div>
      </section>
      <OrderDetails order={order} />
    </div>
  );
}
