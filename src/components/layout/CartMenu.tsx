"use client";

import Image from "next/image";
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
  const { lines } = resolveLines(items, catalog);
  const blocked = checkoutBlocker(lines) !== null;
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
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Your cart is empty. Use “Add to cart” on any product to see it here.</p>
        ) : (
          <>
            <ul className="-mx-1 max-h-72 divide-y overflow-y-auto">
              {lines.map(({ key, product, selection, quantity, unit_price }) => (
                <li key={key} className="flex items-center gap-3 px-1 py-2">
                  {product.images[0] && (
                    <Image src={product.images[0].src} alt="" width={48} height={48} className={`size-12 rounded-lg ${product.images[0].studio ? "bg-white object-contain p-0.5 ring-1 ring-border" : "object-cover"}`} />
                  )}
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
            <p className="flex justify-between border-t pt-3 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </p>
          </>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <PopoverClose asChild>
            <Button asChild variant="outline"><Link href="/cart">View cart</Link></Button>
          </PopoverClose>
          {lines.length > 0 && (
            <PopoverClose asChild>
              <Button asChild>
                <Link href={blocked ? "/cart" : "/checkout/address"} onClick={() => { if (!blocked) start({ kind: "cart" }); }}>Checkout</Link>
              </Button>
            </PopoverClose>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Your cart is saved in this browser only. Prices are sample data.</p>
      </PopoverContent>
    </Popover>
  );
}
