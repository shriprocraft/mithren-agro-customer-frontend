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
import { useBackendCustomerId } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useOrders } from "@/context/OrdersContext";
import { useCheckoutLines } from "@/hooks/useCheckoutLines";
import { quoteErrorMessage, useCheckoutQuote } from "@/hooks/useCheckoutQuote";
import { addressTypeLabels, formatAddressLine, isValidAddress } from "@/lib/address";
import { checkoutBlocker, summarize } from "@/lib/cart";
import { applyQuote, quoteFingerprint } from "@/lib/checkout-quote";
import type { Product } from "@/types/catalog";

// Final check before ordering. "Place order" re-validates everything, is guarded against double
// submission, saves the order, and only then removes the purchased items from the cart.
export function ReviewStep({ catalog }: { catalog: Product[] }) {
  const router = useRouter();
  const { addresses, hydrated: addressesReady } = useAddressBook();
  const { session, finish } = useCheckout();
  const { removeItems } = useCart();
  const { placeOrder, hydrated: ordersReady } = useOrders();
  const { lines, items, isBuyNow, ready } = useCheckoutLines(catalog);
  const backendCustomerId = useBackendCustomerId();
  const address = addresses.find((a) => a.id === session.address_id);
  // With the backend catalogue the server prices this order for this address. Only an address from the
  // customer's account is sent: demo and browser-stored addresses mean nothing to the API.
  const quoteAddressId = backendCustomerId && address ? address.id : null;
  const { state: quote, refresh } = useCheckoutQuote(items, quoteAddressId, ready && addressesReady);
  const placing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!ready || !addressesReady || !ordersReady) return <LoadingState label="Preparing your order…" />;
  // Once placed, the cart empties before navigation finishes; keep showing progress, not "empty cart".
  if (busy) return <LoadingState label="Placing your order…" />;
  // Nothing to check out: no quote is asked for an empty cart, so never wait for one, and never show a
  // quote left over from before the cart emptied (another tab, or the order that was just placed).
  const hasItems = items.length > 0;
  if (hasItems && quote.status === "loading" && !quote.quote) return <LoadingState label="Checking prices and stock…" />;

  const quoted = hasItems && quote.status !== "off" && quote.quote ? applyQuote(lines, items, quote.quote) : null;
  const shownLines = quoted?.lines ?? lines;
  const blocker = !hasItems
    ? checkoutBlocker(lines)
    : quote.status === "error" && !quote.quote
      ? quote.message
      : quoted
        ? quoted.blocker
        : checkoutBlocker(lines);
  if (blocker) {
    return (
      <MessageState icon={ShoppingCart} title={lines.length === 0 ? "There’s nothing to review" : "Your cart needs attention"}
        actions={
          <>
            {hasItems && quote.status === "error" && <Button variant="outline" onClick={() => void refresh().catch(() => undefined)}>Try again</Button>}
            <Button asChild><Link href={lines.length === 0 ? "/products" : "/cart"}>{lines.length === 0 ? "Browse products" : "Return to cart"}</Link></Button>
          </>
        }>
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

  const summary = quoted?.summary ?? summarize(lines);

  const stop = (message: { error?: string; notice?: string }) => {
    placing.current = false;
    setBusy(false);
    setError(message.error ?? null);
    setNotice(message.notice ?? null);
  };

  const submit = async () => {
    if (placing.current) return; // a second click while the first is being handled does nothing
    placing.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    let toOrder = lines;
    if (quote.status !== "off") {
      // Price everything again. If anything differs from what is on screen, show the new quote and
      // let the customer review it: the order is placed only on a click made after seeing it.
      const shown = quote.quote;
      let fresh;
      try {
        fresh = await refresh();
      } catch (e) {
        return stop({ error: quoteErrorMessage(e) });
      }
      if (!fresh || !shown || quoteFingerprint(fresh) !== quoteFingerprint(shown)) {
        return stop({ notice: "Prices or stock changed since this page was opened. Check the updated items and total, then place your order again." });
      }
      if (!fresh.can_checkout) return stop({ error: fresh.blockers[0]?.message ?? "This order can’t be placed right now." });
      toOrder = applyQuote(lines, items, fresh).lines;
      if (toOrder.length !== lines.length) return stop({ error: "Some items couldn’t be priced. Return to your cart and try again." });
    }
    try {
      const order = placeOrder(toOrder, address);
      if (!isBuyNow) removeItems(toOrder.map((line) => line.key));
      finish();
      router.push(`/orders/${order.id}/confirmation`);
    } catch (e) {
      stop({ error: e instanceof Error ? e.message : "Your order could not be placed. Please try again." });
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
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
          {isBuyNow && <p className="mt-1 text-sm text-muted-foreground">Buy now: only this item is ordered. Your cart stays as it is.</p>}
          <ItemList
            label="Items in this order"
            items={shownLines.map(({ key, product, selection, quantity, unit_price, line_total }) => ({
              key, product_id: product.id, name: product.name, unit: selection.description,
              image: product.images[0] ?? { src: "", alt: "" }, unit_price, quantity, line_total,
            }))}
          />
        </section>
      </div>

      <OrderSummary subtotal={summary.subtotal} itemCount={summary.count} charges={summary.charges} total={summary.total}>
        {notice && <p role="alert" className="mt-4 rounded-2xl bg-secondary p-3 text-sm font-medium text-secondary-foreground">{notice}</p>}
        {!notice && quoted?.pricesChanged && (
          <p role="status" className="mt-4 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
            Prices were updated. The items and total shown are the store’s current prices.
          </p>
        )}
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <Button className="mt-4 w-full" onClick={() => void submit()} loading={busy}>
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
