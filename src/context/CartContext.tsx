"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { addToCart, countItems, itemKey, parseCart, removeFromCart, setCartQuantity, type AddResult } from "@/lib/cart";
import type { CartItem } from "@/types/cart";

// The single source of truth for the cart. Saved in this browser's localStorage so it survives a
// refresh (demo only; nothing is sent to a server). Prices and names are looked up from the
// catalogue when rendered (lib/cart.ts resolveLines).
interface CartContextValue {
  items: CartItem[];
  count: number;
  /** False until the saved cart has been read; pages that depend on it wait for this. */
  hydrated: boolean;
  /** "unsaved": added for this visit, but the browser would not store it (private mode, quota). */
  /** `defaultVariantId`: the product's default option, so a line saved before options existed is reused. */
  addItem: (productId: string, quantity?: number, variantId?: string, defaultVariantId?: string) => AddResult | "unsaved";
  /** `key` is the line key (CartLine.key): product plus chosen option. */
  setQuantity: (key: string, quantity: number) => void;
  /** Returns false when the change could not be saved in this browser. */
  removeItem: (key: string) => boolean;
  /** Removes several lines by key, e.g. the ones just ordered. */
  removeItems: (keys: string[]) => void;
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
      addItem: (productId, quantity = 1, variantId, defaultVariantId) => {
        let result: AddResult = "added";
        const persisted = setItems((current) => {
          const next = addToCart(current, productId, quantity, variantId, defaultVariantId);
          result = next.result;
          return next.items;
        });
        return result === "added" && !persisted ? "unsaved" : result;
      },
      setQuantity: (key, quantity) => setItems((current) => setCartQuantity(current, key, quantity)),
      removeItem: (key) => setItems((current) => removeFromCart(current, key)),
      removeItems: (keys) => setItems((current) => current.filter((item) => !keys.includes(itemKey(item)))),
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
