import { AlertTriangle, Ban, CheckCircle2, Clock, Store, Users, type LucideIcon } from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { isDroppedPart, sellerPartLabel } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { Order, SellerPart } from "@/types/order";

const partIcon = (part: SellerPart): LucideIcon =>
  isDroppedPart(part.status) ? Ban : part.status === "awaiting_acceptance" ? Clock : CheckCircle2;

/** The seller parts that will not be delivered. */
export const droppedParts = (order: Order) => (order.seller_parts ?? []).filter((part) => isDroppedPart(part.status));

/** Whether this order is split across sellers (the breakdown is then shown). */
export const isSplitOrder = (order: Order) => (order.seller_parts?.length ?? 0) > 1;

const itemCount = (parts: SellerPart[]) => parts.reduce((n, part) => n + part.items.reduce((m, item) => m + item.quantity, 0), 0);

/** "Green Valley Farm" / "Green Valley Farm and Sunrise Organics" / "A, B and C" */
const names = (parts: SellerPart[]) => {
  const list = [...new Set(parts.map((part) => part.seller_name))];
  return list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list.at(-1)}` : list[0];
};

/**
 * For split orders whose sellers disagree: says plainly which part was rejected or cancelled (it won't be
 * delivered or charged) while the rest goes ahead, or how many sellers have accepted so far. Shown above
 * the timeline, which follows the parts still going ahead.
 */
export function SplitNotice({ order }: { order: Order }) {
  if (order.status === "cancelled" || !order.split_status) return null;
  const parts = order.seller_parts ?? [];
  if (order.split_status === "partially_cancelled") {
    const dropped = droppedParts(order);
    const count = itemCount(dropped);
    const verb = dropped.every((part) => part.status === "rejected") ? "rejected" : "cancelled";
    return (
      <p role="status" className="mb-6 flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
        <span>
          <span className="font-semibold">Part of this order won’t be delivered.</span>{" "}
          {names(dropped)} {verb} {count} {count === 1 ? "item" : "items"}, so {count === 1 ? "it isn’t" : "they aren’t"} charged.
          The rest of your order is going ahead
          {order.payable_total !== undefined ? <>: pay <span className="font-semibold">{formatPrice(order.payable_total)}</span> on delivery.</> : "."}
        </span>
      </p>
    );
  }
  const accepted = parts.filter((part) => part.status !== "awaiting_acceptance" && !isDroppedPart(part.status)).length;
  return (
    <p role="status" className="mb-6 flex gap-3 rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
      <Users className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-semibold">{accepted} of {parts.length} sellers have accepted their part.</span>{" "}
        Your order is confirmed once every seller has accepted.
      </span>
    </p>
  );
}

/**
 * Each seller's part of a split order on its own: the shop, its status (accepted, rejected by the seller…),
 * the seller's reason, its items and amount. A rejected or cancelled part is marked, struck through and
 * shown as not charged, so a rejection is never hidden behind the overall status.
 */
export function SellerParts({ order }: { order: Order }) {
  if (!isSplitOrder(order)) return null;
  const parts = order.seller_parts ?? [];
  return (
    <section aria-labelledby="seller-parts-title" className="surface-card rounded-3xl p-5">
      <h2 id="seller-parts-title" className="font-heading text-lg font-semibold">Sellers in this order</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your order is split across {parts.length} sellers. Each one accepts and sends their items separately.
      </p>
      <ul aria-label="Sellers in this order" className="mt-4 space-y-3">
        {parts.map((part) => {
          const dropped = isDroppedPart(part.status);
          const Icon = partIcon(part);
          const label = sellerPartLabel(part);
          return (
            <li
              key={part.reference}
              aria-label={`${part.seller_name}: ${label}`}
              className={cn("rounded-2xl border p-4", dropped ? "border-destructive/30 bg-destructive/5" : "border-border")}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium">
                    <Store className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    {part.seller_name}
                  </p>
                  <p className="text-xs text-muted-foreground">Seller order {part.reference}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    dropped
                      ? "bg-destructive/10 text-destructive"
                      : part.status === "awaiting_acceptance"
                        ? "bg-highlight/50 text-foreground"
                        : "bg-secondary text-secondary-foreground",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </span>
              </div>
              {dropped && (
                <p className="mt-2 text-sm text-destructive">
                  These items won’t be delivered and you won’t be charged for them.
                  {part.cancel_reason && <span className="mt-0.5 block text-foreground">Seller’s reason: {part.cancel_reason}</span>}
                </p>
              )}
              <ul aria-label={`Items from ${part.seller_name}`} className="mt-3 space-y-1 text-sm">
                {part.items.map((item, index) => (
                  <li key={`${item.product_id ?? item.name}-${item.variant_id ?? ""}-${index}`} className="flex justify-between gap-3">
                    <span className={cn("min-w-0", dropped && "text-muted-foreground line-through")}>
                      {item.name}
                      {item.variant_label && ` · ${item.variant_label}`} × {item.quantity}
                    </span>
                    <span className={cn("shrink-0", dropped && "text-muted-foreground line-through")}>{formatPrice(item.line_total)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex justify-between gap-3 border-t border-border pt-2 text-sm">
                <span className="text-muted-foreground">{dropped ? "Not charged" : "From this seller"}</span>
                <span className={cn("font-heading font-semibold", dropped && "text-muted-foreground line-through")}>
                  {formatPrice(part.amount)}
                  {dropped && <span className="sr-only"> (not charged)</span>}
                </span>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
