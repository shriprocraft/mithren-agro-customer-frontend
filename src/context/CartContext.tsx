"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useBackendCustomerId, useOptionalAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { usePersistentState } from "@/hooks/usePersistentState";
import { addToCart, countItems, itemKey, parseCart, removeFromCart, setCartQuantity, type AddResult } from "@/lib/cart";
import { cartService as defaultCartService, type CartService } from "@/services/cart";
import type { CartItem } from "@/types/cart";

// The single source of truth for the cart, behind one interface:
// - signed in: the customer's cart on the backend (/customer/cart), so it follows them to any device.
//   On sign-in, lines kept in this browser are merged into the account (never removing any) and then
//   cleared here. Every change shows at once and is sent to the API; if the store refuses it, the
//   change is undone and the customer is told.
// - guests: saved in this browser's localStorage until they sign in.
// Prices and names are looked up from the catalogue when rendered (lib/cart.ts resolveLines), and the
// checkout quote prices the cart on the server.
interface CartContextValue {
  items: CartItem[];
  count: number;
  /** False until the cart has been read (browser storage, or the account); pages that depend on it wait. */
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

type AccountCart = { customerId: string; items: CartItem[]; loaded: boolean };

export function CartProvider({ children, service = defaultCartService }: { children: ReactNode; service?: CartService | null }) {
  const [items, setItems, hydrated] = usePersistentState("mithren.cart", EMPTY, parseCart);
  const customerId = useBackendCustomerId();
  // Until sign-in is known, a customer's cart could be either one: show neither yet.
  const authStatus = useOptionalAuth()?.status;
  const sessionPending = Boolean(service) && authStatus === "loading";
  const backend = service && customerId ? service : null;
  const toast = useToast();
  const [account, setAccount] = useState<AccountCart | null>(null);
  // The browser cart as it was when the customer signed in (read once, after storage has loaded).
  const browserItems = useRef<CartItem[]>(items);
  useEffect(() => {
    browserItems.current = items;
  }, [items]);
  // Only the answer to the latest change may replace the account cart: earlier answers are out of date.
  const latestChange = useRef(0);

  useEffect(() => {
    if (!backend || !customerId || !hydrated) return;
    let live = true;
    const local = browserItems.current;
    const load = local.length > 0 ? backend.merge(local) : backend.list();
    load.then(
      (list) => {
        if (!live) return;
        setAccount({ customerId, items: list, loaded: true });
        if (local.length > 0) setItems([]); // now in the account
      },
      () => {
        if (!live) return;
        // Keep the browser cart so nothing is lost; the account cart stays empty until the next load.
        setAccount({ customerId, items: [], loaded: true });
        toast.error("Your cart couldn't be loaded", { id: "cart:load", description: "Check your connection and reload the page." });
      },
    );
    return () => {
      live = false;
    };
  }, [backend, customerId, hydrated, setItems, toast]);

  const accountCart = backend && account?.customerId === customerId ? account : null;

  const value = useMemo<CartContextValue>(() => {
    if (!backend) {
      return {
        items,
        count: countItems(items),
        hydrated: hydrated && !sessionPending,
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
      };
    }

    const list = accountCart?.items ?? EMPTY;
    const replace = (next: CartItem[]) =>
      setAccount((current) => (current && current.customerId === customerId ? { ...current, items: next } : current));
    // Shows the change at once, sends it, then takes the store's cart as the answer (when no later change
    // was made meanwhile). If the store refuses, the cart goes back to how it was before this change.
    const send = (next: CartItem[], request: () => Promise<CartItem[] | void>) => {
      const before = list;
      const change = ++latestChange.current;
      replace(next);
      request().then(
        (server) => {
          if (server && change === latestChange.current) replace(server);
        },
        () => {
          if (change === latestChange.current) replace(before);
          toast.error("Your cart couldn't be updated", { id: "cart:update", description: "Please try again." });
        },
      );
    };
    const find = (key: string) => list.find((item) => itemKey(item) === key);

    return {
      items: list,
      count: countItems(list),
      hydrated: Boolean(accountCart?.loaded),
      addItem: (productId, quantity = 1, variantId, defaultVariantId) => {
        const next = addToCart(list, productId, quantity, variantId, defaultVariantId);
        if (next.result !== "added") return next.result;
        const line = next.items.find((item) => itemKey(item) === itemKey({ product_id: productId, variant_id: variantId, quantity }))!;
        // A line saved before the product had options was joined: the account line moves to the option.
        const legacy = variantId && list.find((item) => item.product_id === productId && item.variant_id === undefined && variantId === defaultVariantId);
        send(next.items, async () => {
          if (legacy) await backend.remove(productId);
          return backend.set(line);
        });
        return "added";
      },
      setQuantity: (key, quantity) => {
        const next = setCartQuantity(list, key, quantity);
        const line = next.find((item) => itemKey(item) === key);
        if (line && line.quantity !== find(key)?.quantity) send(next, () => backend.set(line));
      },
      removeItem: (key) => {
        const line = find(key);
        if (line) send(removeFromCart(list, key), () => backend.remove(line.product_id, line.variant_id));
        return true;
      },
      removeItems: (keys) => {
        const lines = list.filter((item) => keys.includes(itemKey(item)));
        if (lines.length === 0) return;
        const rest = list.filter((item) => !keys.includes(itemKey(item)));
        send(rest, async () => {
          // Emptying the whole cart is one request; otherwise one per line.
          if (rest.length === 0) await backend.clear();
          else await Promise.all(lines.map((line) => backend.remove(line.product_id, line.variant_id)));
        });
      },
    };
  }, [backend, items, hydrated, sessionPending, setItems, accountCart, customerId, toast]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider");
  return cart;
}
