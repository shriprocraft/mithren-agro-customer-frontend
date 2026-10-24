"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CountBadge } from "@/components/layout/CountBadge";
import { useCart } from "@/context/CartContext";
import { effectivePrice, formatPrice } from "@/lib/formatters";
import type { Product } from "@/types/catalog";

// Mini cart: shows what was added on this page. Checkout is a later phase, so there is no checkout button.
export function CartMenu({ catalog }: { catalog: Product[] }) {
  const { items, count, removeItem } = useCart();
  const lines = items.flatMap((item) => {
    const product = catalog.find((p) => p.id === item.product_id);
    return product ? [{ product, quantity: item.quantity }] : [];
  });
  const subtotal = lines.reduce((sum, line) => sum + effectivePrice(line.product) * line.quantity, 0);

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
              {lines.map(({ product, quantity }) => (
                <li key={product.id} className="flex items-center gap-3 px-1 py-2">
                  {product.images[0] && (
                    <Image src={product.images[0].src} alt="" width={48} height={48} className={`size-12 rounded-lg ${product.images[0].studio ? "bg-white object-contain p-0.5 ring-1 ring-border" : "object-cover"}`} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {quantity} × {formatPrice(effectivePrice(product))}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(product.id)} aria-label={`Remove ${product.name} from cart`}>
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
              <Button asChild><Link href="/cart">Checkout</Link></Button>
            </PopoverClose>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Your cart is saved in this browser only. Prices are sample data.</p>
      </PopoverContent>
    </Popover>
  );
}
