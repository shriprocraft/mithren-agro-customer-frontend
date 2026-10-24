"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { addToCart, countItems, removeFromCart, type AddResult } from "@/lib/cart";
import type { CartItem } from "@/types/cart";

// Frontend-only cart for the preview. Nothing is persisted or sent to a server.
interface CartContextValue {
  items: CartItem[];
  count: number;
  addItem: (productId: string) => AddResult;
  removeItem: (productId: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: countItems(items),
      addItem: (productId) => {
        const next = addToCart(items, productId);
        setItems(next.items);
        return next.result;
      },
      removeItem: (productId) => setItems((current) => removeFromCart(current, productId)),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider");
  return cart;
}
