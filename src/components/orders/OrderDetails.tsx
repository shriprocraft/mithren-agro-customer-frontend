import { ItemList } from "@/components/checkout/ItemList";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { OrderPolicyNote } from "@/components/orders/OrderPolicyNote";
import { SellerParts, droppedParts, isSplitOrder } from "@/components/orders/SellerParts";
import { addressTypeLabels, formatAddressLine } from "@/lib/address";
import { formatPrice } from "@/lib/formatters";
import { isDroppedPart, sellerPartStatusLabels } from "@/lib/orders";
import type { Order } from "@/types/order";

export const formatOrderTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

/** Address, each seller's part (split orders), items and totals of a saved order: identical on the
 *  confirmation and tracking pages. */
export function OrderDetails({ order }: { order: Order }) {
  const itemCount = order.items.reduce((n, item) => n + item.quantity, 0);
  const split = isSplitOrder(order) && order.status !== "cancelled";
  const notCharged = droppedParts(order).reduce((sum, part) => sum + part.amount, 0);
  const showPayable = order.status !== "cancelled" && order.payable_total !== undefined && order.payable_total < order.total;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="space-y-6">
        <section aria-labelledby="order-address-title" className="surface-card rounded-3xl p-5">
          <h2 id="order-address-title" className="font-heading text-lg font-semibold">Delivery address</h2>
          <p className="mt-3 font-medium">
            {order.address.full_name}
            <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{addressTypeLabels[order.address.type]}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{formatAddressLine(order.address)}</p>
          <p className="text-sm text-muted-foreground">Mobile {order.address.mobile}</p>
        </section>
        <SellerParts order={order} />
        <section aria-labelledby="order-items-title" className="surface-card rounded-3xl p-5">
          <h2 id="order-items-title" className="font-heading text-lg font-semibold">Items</h2>
          <ItemList
            label="Items in this order"
            items={order.items.map((item) => {
              const dropped = item.seller_status !== undefined && isDroppedPart(item.seller_status);
              return {
                ...item,
                key: `${item.product_id}::${item.variant_id ?? ""}`,
                unit: item.variant_label ? `${item.unit} · ${item.variant_label}` : item.unit,
                image: { src: item.image_src, alt: item.image_alt, studio: item.image_studio },
                // Products (not combo boxes) of an order that isn't cancelled, and that their seller didn't drop, can be reviewed.
                reviewable: order.status !== "cancelled" && item.kind === "product" && !dropped,
                // Split orders: each product says where its own seller has got.
                ...(split && item.seller_status && {
                  status: {
                    label: item.seller_status === "cancelled" ? "Cancelled by the seller" : sellerPartStatusLabels[item.seller_status],
                    dropped,
                  },
                }),
              };
            })}
          />
        </section>
      </div>
      <div className="space-y-6">
        <OrderSummary subtotal={order.subtotal} itemCount={itemCount} charges={order.charges} total={order.total}>
          {showPayable && (
            <dl className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Rejected or cancelled by sellers</dt>
                <dd className="font-medium text-destructive">−{formatPrice(notCharged || order.total - order.payable_total!)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-base">
                <dt className="font-semibold">To pay on delivery</dt>
                <dd className="font-heading font-semibold">{formatPrice(order.payable_total!)}</dd>
              </div>
            </dl>
          )}
        </OrderSummary>
        <OrderPolicyNote order={order} />
      </div>
    </div>
  );
}
