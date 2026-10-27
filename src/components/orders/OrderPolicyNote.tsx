import Link from "next/link";
import { RotateCcw, XCircle } from "lucide-react";
import { canRequestCancellation, isReturnEligibleCategory, policyConfig, returnWindowEnd } from "@/config/policies";
import { categories } from "@/data/categories";
import { orderStatusLabels } from "@/lib/orders";
import type { Order } from "@/types/order";

const formatDate = (date: Date) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
const linkClass = "font-medium text-primary underline-offset-4 hover:underline";

// What the cancellation and return policies mean for this order, from the same rules the policy pages
// state (config/policies.ts): cancellation can be requested until the order is packed; the return
// window applies only to eligible apparel, counted from the delivery date. There is no self-service
// cancellation or return yet, so the note points to support.
export function OrderPolicyNote({ order }: { order: Order }) {
  const packed = orderStatusLabels[policyConfig.cancellation.packedStatus];
  const deliveredAt = order.history.find((event) => event.status === "delivered")?.at;
  const returnable = order.items.filter((item) => isReturnEligibleCategory(categories.find((c) => c.id === item.category_id)?.slug));
  const windowEnd = deliveredAt ? returnWindowEnd(deliveredAt) : null;

  return (
    <section aria-labelledby="order-policy-title" className="rounded-3xl bg-soft p-5 text-sm ring-1 ring-border">
      <h2 id="order-policy-title" className="font-heading text-base font-semibold">Cancellation and returns</h2>
      <p className="mt-2 flex gap-2 text-muted-foreground">
        <XCircle className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
        <span>
          {canRequestCancellation(order.status)
            ? `You can ask to cancel this order until it is packed (“${packed}”). Contact support with the order ID.`
            : order.status === "delivered"
              ? "This order has been delivered."
              : `This order has been packed, so it can no longer be cancelled. If something is wrong, contact support.`}
        </span>
      </p>
      {returnable.length > 0 && (
        <p className="mt-2 flex gap-2 text-muted-foreground">
          <RotateCcw className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          <span>
            {windowEnd
              ? `${returnable.map((item) => item.name).join(", ")}: return requests can be made until ${formatDate(windowEnd)} (${policyConfig.returns.windowDays} days from delivery), if the item meets the return conditions.`
              : `${returnable.map((item) => item.name).join(", ")}: eligible for return within ${policyConfig.returns.windowDays} days of delivery, if the item meets the return conditions.`}
          </span>
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        <Link href="/cancellation-refund-policy" className={linkClass}>Cancellation and Refund Policy</Link> ·{" "}
        <Link href="/return-policy" className={linkClass}>Return Policy</Link> · <Link href="/support#contact" className={linkClass}>Contact support</Link>
      </p>
    </section>
  );
}
