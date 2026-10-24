import type { CartItem } from "@/types/cart";

/** Placeholder until per-seller stock rules are confirmed (see docs/REQUIREMENTS_REGISTER.md). */
export const MAX_QUANTITY_PER_ITEM = 20;

export type AddResult = "added" | "limit_reached";

/** Adding an existing product increases its quantity instead of creating a duplicate line. */
export function addToCart(items: CartItem[], productId: string): { items: CartItem[]; result: AddResult } {
  const existing = items.find((item) => item.product_id === productId);
  if (!existing) {
    return { items: [...items, { product_id: productId, quantity: 1 }], result: "added" };
  }
  if (existing.quantity >= MAX_QUANTITY_PER_ITEM) {
    return { items, result: "limit_reached" };
  }
  return {
    items: items.map((item) =>
      item.product_id === productId ? { ...item, quantity: item.quantity + 1 } : item,
    ),
    result: "added",
  };
}

export function removeFromCart(items: CartItem[], productId: string): CartItem[] {
  return items.filter((item) => item.product_id !== productId);
}

export function countItems(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}
