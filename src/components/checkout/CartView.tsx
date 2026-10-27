"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, ShoppingCart, Trash2 } from "lucide-react";
import { LoadingState, MessageState } from "@/components/checkout/PageState";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CatalogImage } from "@/components/products/CatalogImage";
import { QuantityStepper } from "@/components/products/QuantityStepper";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useRemovedFromCartToast } from "@/hooks/useRemovedFromCartToast";
import { checkoutBlocker, resolveLines, summarize } from "@/lib/cart";
import { formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

// The cart page. Reads the shared cart (CartContext), so the header count and this page never disagree.
export function CartView({ catalog, vendorNames }: { catalog: Product[]; vendorNames: Record<string, string> }) {
  const router = useRouter();
  const announce = useAnnounce();
  const { items, hydrated, setQuantity, removeItem } = useCart();
  const { start } = useCheckout();
  const removed = useRemovedFromCartToast();

  if (!hydrated) return <LoadingState label="Loading your cart…" />;

  const { lines, missing } = resolveLines(items, catalog);
  const summary = summarize(lines);
  const blocker = checkoutBlocker(lines);

  if (lines.length === 0) {
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
        {missing.length > 0 && (
          <p role="status" className="mb-3 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
            {missing.length === 1 ? "One item is" : `${missing.length} items are`} no longer listed and won’t be ordered.
          </p>
        )}
        <ul className="surface-card divide-y rounded-3xl">
          {lines.map(({ key, product, selection, quantity, unit_price, line_total, issue }) => {
            const image = product.images[0];
            // One layout at every width: thumbnail, then name/pack/seller/unit price with Remove at the
            // top right, then the quantity stepper with the line total opposite it.
            return (
              <li key={key} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                <Link href={`/products/${product.id}`} className={cn("relative size-18 shrink-0 overflow-hidden rounded-xl sm:size-24", image?.studio ? "bg-white ring-1 ring-border" : "bg-muted")} tabIndex={-1} aria-hidden="true">
                  {image && <CatalogImage image={image} alt="" sizes="96px" />}
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
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <QuantityStepper value={quantity} label={`Quantity of ${product.name}, ${selection.description}`} disabled={issue === "out_of_stock"}
                      onChange={(q) => { setQuantity(key, q); announce(`${product.name}: quantity ${q}.`); }} />
                    <p className="font-heading font-semibold"><span className="sr-only">Line total </span>{formatPrice(line_total)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </section>

      <OrderSummary subtotal={summary.subtotal} itemCount={summary.count} charges={summary.charges} total={summary.total}>
        {blocker && <p role="alert" className="mt-4 text-sm text-destructive">{blocker}</p>}
        <Button className="mt-4 w-full" disabled={!!blocker} onClick={proceed}>
          Proceed to checkout
          <ArrowRight aria-hidden="true" />
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">Your cart is saved in this browser only. Prices are sample data.</p>
      </OrderSummary>
    </div>
  );
}
