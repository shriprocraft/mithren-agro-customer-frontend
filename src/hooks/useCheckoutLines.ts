"use client";

import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { resolveLines, type CartLine } from "@/lib/cart";
import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/catalog";

/**
 * The lines being checked out: the whole cart, or the single "Buy now" product. One place, so the
 * address, review and confirmation steps always agree with each other and with the cart. `items` are
 * the stored items behind the lines, as the checkout quote is asked for them.
 */
export function useCheckoutLines(catalog: Product[]): { lines: CartLine[]; items: CartItem[]; missing: string[]; isBuyNow: boolean; ready: boolean } {
  const cart = useCart();
  const { session, hydrated } = useCheckout();
  const { source } = session;
  const items =
    source.kind === "buy_now"
      ? [{ product_id: source.product_id, ...(source.variant_id && { variant_id: source.variant_id }), quantity: source.quantity }]
      : cart.items;
  // `missing`: items this page's catalogue can't show. They are still part of `items` (and the order), so
  // checkout waits until every item is on screen rather than ordering something the customer can't see.
  const { lines, missing } = resolveLines(items, catalog);
  return {
    lines,
    items,
    missing,
    isBuyNow: session.source.kind === "buy_now",
    ready: hydrated && cart.hydrated,
  };
}
