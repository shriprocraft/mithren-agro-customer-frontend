"use client";

import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { resolveLines, type CartLine } from "@/lib/cart";
import type { Product } from "@/types/catalog";

/**
 * The lines being checked out: the whole cart, or the single "Buy now" product. One place, so the
 * address, review and confirmation steps always agree with each other and with the cart.
 */
export function useCheckoutLines(catalog: Product[]): { lines: CartLine[]; isBuyNow: boolean; ready: boolean } {
  const cart = useCart();
  const { session, hydrated } = useCheckout();
  const items = session.source.kind === "buy_now" ? [{ product_id: session.source.product_id, quantity: session.source.quantity }] : cart.items;
  return {
    lines: resolveLines(items, catalog).lines,
    isBuyNow: session.source.kind === "buy_now",
    ready: hydrated && cart.hydrated,
  };
}
