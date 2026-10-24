"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { addToCart, countItems, parseCart, removeFromCart, setCartQuantity, type AddResult } from "@/lib/cart";
import type { CartItem } from "@/types/cart";

// The single source of truth for the cart. Saved in this browser's localStorage so it survives a
// refresh (demo only; nothing is sent to a server). Prices and names are looked up from the
// catalogue when rendered (lib/cart.ts resolveLines).
interface CartContextValue {
  items: CartItem[];
  count: number;
  /** False until the saved cart has been read; pages that depend on it wait for this. */
  hydrated: boolean;
  addItem: (productId: string, quantity?: number) => AddResult;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  /** Removes several products, e.g. the ones just ordered. */
  removeItems: (productIds: string[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const EMPTY: CartItem[] = [];

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems, hydrated] = usePersistentState("mithren.cart", EMPTY, parseCart);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: countItems(items),
      hydrated,
      addItem: (productId, quantity = 1) => {
        let result: AddResult = "added";
        setItems((current) => {
          const next = addToCart(current, productId, quantity);
          result = next.result;
          return next.items;
        });
        return result;
      },
      setQuantity: (productId, quantity) => setItems((current) => setCartQuantity(current, productId, quantity)),
      removeItem: (productId) => setItems((current) => removeFromCart(current, productId)),
      removeItems: (productIds) => setItems((current) => current.filter((item) => !productIds.includes(item.product_id))),
    }),
    [items, hydrated, setItems],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider");
  return cart;
}
