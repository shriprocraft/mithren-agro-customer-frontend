"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, PackageCheck, ShoppingCart } from "lucide-react";
import { ItemList } from "@/components/checkout/ItemList";
import { LoadingState, MessageState } from "@/components/checkout/PageState";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Button } from "@/components/ui/button";
import { useAddressBook } from "@/context/AddressBookContext";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useOrders } from "@/context/OrdersContext";
import { useCheckoutLines } from "@/hooks/useCheckoutLines";
import { addressTypeLabels, formatAddressLine, isValidAddress } from "@/lib/address";
import { checkoutBlocker, summarize } from "@/lib/cart";
import type { Product } from "@/types/catalog";

// Final check before ordering. "Place order" re-validates everything, is guarded against double
// submission, saves the order, and only then removes the purchased items from the cart.
export function ReviewStep({ catalog }: { catalog: Product[] }) {
  const router = useRouter();
  const { addresses, hydrated: addressesReady } = useAddressBook();
  const { session, finish } = useCheckout();
  const { removeItems } = useCart();
  const { placeOrder, hydrated: ordersReady } = useOrders();
  const { lines, isBuyNow, ready } = useCheckoutLines(catalog);
  const placing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready || !addressesReady || !ordersReady) return <LoadingState label="Preparing your order…" />;
  // Once placed, the cart empties before navigation finishes; keep showing progress, not "empty cart".
  if (busy) return <LoadingState label="Placing your order…" />;

  const address = addresses.find((a) => a.id === session.address_id);
  const blocker = checkoutBlocker(lines);
  if (blocker) {
    return (
      <MessageState icon={ShoppingCart} title={lines.length === 0 ? "There’s nothing to review" : "Your cart needs attention"}
        actions={<Button asChild><Link href={lines.length === 0 ? "/products" : "/cart"}>{lines.length === 0 ? "Browse products" : "Return to cart"}</Link></Button>}>
        {blocker}
      </MessageState>
    );
  }
  if (!address || !isValidAddress(address)) {
    return (
      <MessageState icon={MapPin} title="Choose a delivery address first" actions={<Button asChild><Link href="/checkout/address">Choose an address</Link></Button>}>
        We need a complete delivery address before you can review your order.
      </MessageState>
    );
  }

  const summary = summarize(lines);

  const submit = () => {
    if (placing.current) return; // a second click while the first is being handled does nothing
    placing.current = true;
    setBusy(true);
    setError(null);
    try {
      const order = placeOrder(lines, address);
      if (!isBuyNow) removeItems(order.items.map((item) => item.product_id));
      finish();
      router.push(`/orders/${order.id}/confirmation`);
    } catch (e) {
      placing.current = false;
      setBusy(false);
      setError(e instanceof Error ? e.message : "Your order could not be placed. Please try again.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="space-y-6">
        <section aria-labelledby="review-address-title" className="surface-card rounded-3xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 id="review-address-title" className="font-heading text-lg font-semibold">Delivery address</h2>
            <Button asChild variant="outline"><Link href="/checkout/address">Edit address</Link></Button>
          </div>
          <p className="mt-3 font-medium">
            {address.full_name}
            <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{addressTypeLabels[address.type]}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{formatAddressLine(address)}</p>
          <p className="text-sm text-muted-foreground">Mobile {address.mobile}</p>
        </section>

        <section aria-labelledby="review-items-title" className="surface-card rounded-3xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 id="review-items-title" className="font-heading text-lg font-semibold">Items</h2>
            {!isBuyNow && <Button asChild variant="outline"><Link href="/cart">Return to cart</Link></Button>}
          </div>
          <ItemList
            label="Items in this order"
            items={lines.map(({ product, quantity, unit_price, line_total }) => ({
              product_id: product.id, name: product.name, unit: product.unit,
              image: product.images[0] ?? { src: "", alt: "" }, unit_price, quantity, line_total,
            }))}
          />
        </section>
      </div>

      <OrderSummary subtotal={summary.subtotal} itemCount={summary.count} charges={summary.charges} total={summary.total}>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <Button className="mt-4 w-full" onClick={submit} loading={busy}>
          <PackageCheck aria-hidden="true" />
          {busy ? "Placing order…" : "Place order"}
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Demo checkout: no payment is taken and sellers are not notified. The order is saved in this browser only.
        </p>
      </OrderSummary>
    </div>
  );
}
