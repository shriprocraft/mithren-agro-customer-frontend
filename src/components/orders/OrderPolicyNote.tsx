import Link from "next/link";
import { RotateCcw, XCircle } from "lucide-react";
import { canRequestCancellation, isReturnEligibleCategory, policyConfig, returnWindowEnd } from "@/config/policies";
import { useCatalogCategories } from "@/context/CatalogCategoriesContext";
import { categorySlugOf } from "@/lib/catalog-display";
import { isDroppedPart } from "@/lib/orders";
import type { Order } from "@/types/order";

const formatDate = (date: Date) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
const linkClass = "font-medium text-primary underline-offset-4 hover:underline";

// What the cancellation and return policies mean for this order, from the same rules the policy pages
// state (config/policies.ts): the order can be cancelled online until a seller accepts it (the store's
// `cancellable`); the return window applies only to eligible apparel that is actually delivered (not
// items a seller rejected), counted from the delivery date. There is no self-service
// return yet, so the note points to support for returns.
export function OrderPolicyNote({ order }: { order: Order }) {
  const categories = useCatalogCategories();
  // The store says whether it can still be cancelled (no seller has accepted it yet); without that answer
  // (older responses), the packing rule from the policy decides.
  const cancellable = order.cancellable ?? canRequestCancellation(order.status);
  const packed = order.cancel_unavailable ? order.cancel_unavailable === "packed" : !canRequestCancellation(order.status);
  const deliveredAt = order.history.find((event) => event.status === "delivered")?.at;
  const slugOf = (id: string | undefined) => categorySlugOf(id, categories);
  // Items a seller rejected or cancelled are never delivered, so they have no return window.
  const returnable = order.items.filter(
    (item) => !(item.seller_status && isDroppedPart(item.seller_status)) && isReturnEligibleCategory(item.category_slug ?? slugOf(item.category_id)),
  );
  const windowEnd = deliveredAt ? returnWindowEnd(deliveredAt) : null;

  return (
    <section aria-labelledby="order-policy-title" className="rounded-3xl bg-soft p-5 text-sm ring-1 ring-border">
      <h2 id="order-policy-title" className="font-heading text-base font-semibold">Cancellation and returns</h2>
      <p className="mt-2 flex gap-2 text-muted-foreground">
        <XCircle className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
        <span>
          {order.status === "cancelled"
            ? "This order was cancelled."
            : order.status === "delivered"
              ? "This order has been delivered."
              : cancellable
                ? "You can cancel this order until a seller accepts it, with “Cancel order” on its order details or tracking page."
                : packed
                  ? "This order has been packed, so it can no longer be cancelled. If something is wrong, contact support."
                  : "A seller has accepted this order, so it can no longer be cancelled online. If something is wrong, contact support."}
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
