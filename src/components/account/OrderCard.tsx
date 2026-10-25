import Link from "next/link";
import { Truck } from "lucide-react";
import { formatOrderTime } from "@/components/orders/OrderDetails";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/formatters";
import { orderStatusLabels } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/order";

export function OrderStatusBadge({ order }: { order: Order }) {
  const delivered = order.status === "delivered";
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", delivered ? "bg-secondary text-secondary-foreground" : "bg-highlight/50 text-foreground")}>
      {orderStatusLabels[order.status]}
    </span>
  );
}

/** "Tomatoes × 2, Robusta Bananas × 1 and 1 more" */
export function itemsSummary(order: Order, shown = 2): string {
  const parts = order.items.slice(0, shown).map((item) => `${item.name} × ${item.quantity}`);
  const rest = order.items.length - shown;
  return rest > 0 ? `${parts.join(", ")} and ${rest} more` : parts.join(", ");
}

/** One order in the account: ID, date, status, items, total, and links to details and tracking. */
export function OrderCard({ order }: { order: Order }) {
  return (
    <article aria-labelledby={`order-${order.id}`} className="surface-card rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 id={`order-${order.id}`} className="font-mono text-sm font-semibold break-all">{order.id}</h3>
          <p className="text-xs text-muted-foreground">Placed {formatOrderTime(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {order.is_sample && <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Sample order</span>}
          <OrderStatusBadge order={order} />
        </div>
      </div>
      <p className="mt-3 text-sm">{itemsSummary(order)}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-sm text-muted-foreground">
          Total <span className="font-heading font-semibold text-foreground">{formatPrice(order.total)}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href={`/account/orders/${order.id}`}>View details<span className="sr-only">: order {order.id}</span></Link></Button>
          <Button asChild variant="secondary"><Link href={`/orders/${order.id}/tracking`}><Truck aria-hidden="true" />Track<span className="sr-only"> order {order.id}</span></Link></Button>
        </div>
      </div>
    </article>
  );
}
