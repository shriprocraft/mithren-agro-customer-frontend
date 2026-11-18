"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { AlertTriangle, ArrowRight, ShoppingCart, Trash2 } from "lucide-react";
import { LoadingState, MessageState } from "@/components/checkout/PageState";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CatalogImage } from "@/components/products/CatalogImage";
import { QuantityStepper } from "@/components/products/QuantityStepper";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useToast } from "@/context/ToastContext";
import { useCheckoutQuote } from "@/hooks/useCheckoutQuote";
import { useRemovedFromCartToast } from "@/hooks/useRemovedFromCartToast";
import { limitMessage, quantityLimits, resolveLines, summarize } from "@/lib/cart";
import { applyQuote } from "@/lib/checkout-quote";
import { formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

// The cart page. Reads the shared cart (CartContext), so the header count and this page never disagree.
export function CartView({ catalog, vendorNames }: { catalog: Product[]; vendorNames: Record<string, string> }) {
  const router = useRouter();
  const announce = useAnnounce();
  const { items, hydrated, setQuantity, removeItem, removeItems } = useCart();
  const { start } = useCheckout();
  const removed = useRemovedFromCartToast();
  // The server prices the cart (a guest quote: no address); without it nothing can be checked out.
  const { state: quote, refresh } = useCheckoutQuote(items, null, hydrated);
  const toast = useToast();
  // Items the store no longer sells (archived, deleted or switched off by the seller) leave the cart on
  // their own, with a notice naming them: only what the server reports unavailable in a quote of the cart
  // as it is now (never an older answer, whose positions may point at other lines), and never what this
  // page's catalogue merely lacks. Out-of-stock lines stay, marked, until the customer removes them.
  const current = quote.status === "ready" && quote.quote ? quote.quote : null;
  const goneKey = current ? applyQuote([], items, current).unavailableKeys.join("|") : "";
  const names = useMemo(() => new Map(catalog.map((product) => [product.id, product.name])), [catalog]);
  useEffect(() => {
    if (!goneKey) return;
    const keys = goneKey.split("|");
    removeItems(keys);
    const named = keys.map((key) => names.get(key.split(":")[0] ?? "")).filter((name): name is string => Boolean(name));
    toast.info(keys.length > 1 ? "Some items were removed from your cart" : "An item was removed from your cart", {
      id: "cart:gone",
      description: `${named.length === keys.length ? named.join(", ") : keys.length > 1 ? "These items" : "This item"}: the seller no longer sells ${keys.length > 1 ? "them" : "it"}, so ${keys.length > 1 ? "they were" : "it was"} taken out of your cart.`,
    });
  }, [goneKey, names, removeItems, toast]);

  const resolved = resolveLines(items, catalog);
  // A line this page can't show (its product was listed after the page loaded) is never hidden: the page
  // reloads its catalogue once, and meanwhile the line is shown with a way to remove it.
  const unseenKey = resolved.missing.filter((key) => !goneKey.split("|").includes(key)).join("|");
  const refreshedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated || !unseenKey || refreshedFor.current === unseenKey) return;
    refreshedFor.current = unseenKey;
    router.refresh();
  }, [hydrated, unseenKey, router]);

  if (!hydrated) return <LoadingState label="Loading your cart…" />;

  const quoted = quote.quote ? applyQuote(resolved.lines, items, quote.quote) : null;
  const priced = new Map(quoted?.lines.map((line) => [line.key, line]));
  const lines = quoted ? resolved.lines.map((line) => priced.get(line.key) ?? line) : resolved.lines;
  const unseen = unseenKey ? unseenKey.split("|") : [];
  const summary = quoted?.summary ?? summarize(lines);
  const blocker =
    quote.status === "error"
      ? quote.message
      : quote.status === "loading" || !quoted
        ? "Checking prices and stock…"
        : unseen.length > 0
          ? "Some items are still loading. Reload the page, or remove them to continue."
          : quoted.blocker;

  if (lines.length === 0 && unseen.length === 0) {
    return (
      <MessageState
        icon={ShoppingCart}
        title="Your cart is empty"
        actions={<Button asChild><Link href="/products">Continue shopping</Link></Button>}
      >
        Browse fresh produce, pantry staples, farm supplies and apparel, then add items here.
      </MessageState>
    );
  }

  const proceed = () => {
    start({ kind: "cart" });
    router.push("/checkout/address");
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      {/* min-w-0: grid items default to their content width, and the one-line seller text would overflow. */}
      <section aria-labelledby="cart-items-title" className="min-w-0">
        <h2 id="cart-items-title" className="sr-only">Items in your cart</h2>

        {quoted?.pricesChanged && (
          <p role="status" className="mb-3 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
            Prices were updated. The amounts below are the store’s current prices.
          </p>
        )}
        <ul className="surface-card divide-y rounded-3xl">
          {lines.map(({ key, product, selection, quantity, unit_price, line_total, issue }) => {
            const image = product.images[0];
            const limits = quantityLimits(product, selection);
            // One layout at every width: thumbnail, then name/pack/seller/unit price with Remove at the
            // top right, then the quantity stepper with the line total opposite it.
            return (
              <li key={key} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                <Link href={`/products/${product.id}`} className={cn("relative size-18 shrink-0 overflow-hidden rounded-xl sm:size-24", image?.studio ? "bg-white ring-1 ring-border" : "bg-muted")} tabIndex={-1} aria-hidden="true">
                  <CatalogImage image={image} alt="" sizes="96px" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/products/${product.id}`} className="line-clamp-2 font-medium leading-snug hover:text-primary hover:underline">{product.name}</Link>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">{selection.description} · {vendorNames[product.vendor_id] ?? "Independent seller"}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{formatPrice(unit_price)} each</p>
                    </div>
                    <Button variant="ghost" size="icon" className="-mt-1.5 -mr-1.5 shrink-0 text-muted-foreground hover:text-destructive" aria-label={`Remove ${product.name}, ${selection.description}, from cart`}
                      onClick={() => removed(product.name, removeItem(key))}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                  {issue === "out_of_stock" && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                      <AlertTriangle className="size-4" aria-hidden="true" /> Out of stock: remove to continue
                    </p>
                  )}
                  {issue === "insufficient_stock" && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                      <AlertTriangle className="size-4" aria-hidden="true" /> {limits.byStock && limits.max > 0 ? `Only ${limits.max} available: lower the quantity to continue` : "Not enough stock for this quantity: lower it to continue"}
                    </p>
                  )}
                  {(issue === "above_max_quantity" || issue === "below_min_quantity") && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                      <AlertTriangle className="size-4" aria-hidden="true" /> {issue === "above_max_quantity" ? `The seller allows up to ${limits.max} per order` : `The seller sells at least ${limits.min} per order`}: adjust it to continue
                    </p>
                  )}
                  {!issue && quantity >= limits.max && limits.byStock && (
                    <p className="mt-1 text-sm text-warning">{limitMessage(limits)}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <QuantityStepper value={quantity} label={`Quantity of ${product.name}, ${selection.description}`} disabled={issue === "out_of_stock"}
                      min={limits.min} max={Math.max(limits.max, 1)}
                      onChange={(q) => { setQuantity(key, q, limits.max); announce(`${product.name}: quantity ${q}.`); }} />
                    <p className="font-heading font-semibold"><span className="sr-only">Line total </span>{formatPrice(line_total)}</p>
                  </div>
                </div>
              </li>
            );
          })}
          {unseen.map((key) => (
            <li key={key} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">An item in your cart</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Its details are still loading. Reload the page to see it.</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="Remove this item from cart"
                onClick={() => removed("The item", removeItem(key))}>
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </section>

      <OrderSummary subtotal={summary.subtotal} itemCount={summary.count} charges={summary.charges} total={summary.total}>
        {blocker && <p role={quote.status === "loading" ? "status" : "alert"} className={cn("mt-4 text-sm", quote.status === "loading" ? "text-muted-foreground" : "text-destructive")}>{blocker}</p>}
        {quote.status === "error" && (
          <Button variant="outline" className="mt-3 w-full" onClick={() => void refresh().catch(() => undefined)}>Try again</Button>
        )}
        <Button className="mt-4 w-full" disabled={!!blocker} onClick={proceed}>
          Proceed to checkout
          <ArrowRight aria-hidden="true" />
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Your cart is saved in this browser. Prices and stock are checked by the store.
        </p>
      </OrderSummary>
    </div>
  );
}
