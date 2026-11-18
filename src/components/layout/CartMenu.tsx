"use client";

import { CatalogImage } from "@/components/products/CatalogImage";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CountBadge } from "@/components/layout/CountBadge";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useRemovedFromCartToast } from "@/hooks/useRemovedFromCartToast";
import { checkoutBlocker, resolveLines } from "@/lib/cart";
import { formatPrice } from "@/lib/formatters";
import type { Product } from "@/types/catalog";

// Mini cart. "Checkout" starts the same cart checkout as the cart page; when something blocks it (such
// as an out-of-stock line) it opens the cart instead, where the problem is explained.
export function CartMenu({ catalog }: { catalog: Product[] }) {
  const { items, count, removeItem } = useCart();
  const { start } = useCheckout();
  const removed = useRemovedFromCartToast();
  // Same lines as the cart page: each product option with its own price.
  // Lines this header's catalogue can't show (listed after the page loaded) are counted, never hidden;
  // the cart page loads them.
  const { lines, missing } = resolveLines(items, catalog);
  const blocked = missing.length > 0 || checkoutBlocker(lines) !== null;
  const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
          <ShoppingCart className="size-5" aria-hidden="true" />
          <CountBadge count={count} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] gap-3 p-4">
        <p className="font-heading text-base font-medium">Your cart</p>
        {lines.length === 0 && missing.length === 0 ? (
          <p className="text-sm text-muted-foreground">Your cart is empty. Use “Add to cart” on any product to see it here.</p>
        ) : (
          <>
            <ul className="-mx-1 max-h-72 divide-y overflow-y-auto">
              {lines.map(({ key, product, selection, quantity, unit_price }) => (
                <li key={key} className="flex items-center gap-3 px-1 py-2">
                  <span className={`relative size-12 shrink-0 overflow-hidden rounded-lg ${product.images[0]?.studio ? "bg-white ring-1 ring-border" : "bg-muted"}`}>
                    <CatalogImage image={product.images[0]} alt="" sizes="48px" className={product.images[0]?.studio ? "p-0.5" : undefined} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selection.description} · {quantity} × {formatPrice(unit_price)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removed(product.name, removeItem(key))} aria-label={`Remove ${product.name}, ${selection.description}, from cart`}>
                    <X aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
            {missing.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {missing.length === 1 ? "1 more item" : `${missing.length} more items`} in your cart can’t be shown here. Open the cart to see {missing.length === 1 ? "it" : "them"}.
              </p>
            )}
            <p className="flex justify-between border-t pt-3 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </p>
          </>
        )}
        <div className="grid gap-2">
          <PopoverClose asChild>
            <Button asChild className="w-full justify-center text-center"><Link href="/cart">View cart</Link></Button>
          </PopoverClose>
          {(lines.length > 0 || missing.length > 0) && (
            <PopoverClose asChild>
              <Button asChild variant="buy" className="w-full justify-center text-center">
                <Link href={blocked ? "/cart" : "/checkout/address"} onClick={() => { if (!blocked) start({ kind: "cart" }); }}>Checkout</Link>
              </Button>
            </PopoverClose>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Your cart is saved in this browser. Prices and stock are checked by the store at checkout.</p>
      </PopoverContent>
    </Popover>
  );
}
