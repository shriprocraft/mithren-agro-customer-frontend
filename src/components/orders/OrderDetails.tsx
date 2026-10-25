import { ItemList } from "@/components/checkout/ItemList";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { addressTypeLabels, formatAddressLine } from "@/lib/address";
import type { Order } from "@/types/order";

export const formatOrderTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

/** Address, items and totals of a saved order: identical on the confirmation and tracking pages. */
export function OrderDetails({ order }: { order: Order }) {
  const itemCount = order.items.reduce((n, item) => n + item.quantity, 0);
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
        <section aria-labelledby="order-items-title" className="surface-card rounded-3xl p-5">
          <h2 id="order-items-title" className="font-heading text-lg font-semibold">Items</h2>
          <ItemList
            label="Items in this order"
            items={order.items.map((item) => ({
              ...item,
              image: { src: item.image_src, alt: item.image_alt, studio: item.image_studio },
            }))}
          />
        </section>
      </div>
      <OrderSummary subtotal={order.subtotal} itemCount={itemCount} charges={order.charges} total={order.total} />
    </div>
  );
}
