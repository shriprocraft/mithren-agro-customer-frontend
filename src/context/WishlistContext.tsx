"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";

// Frontend-only wishlist, saved in this browser's localStorage (demo; not tied to an account).
interface WishlistContextValue {
  ids: string[];
  hydrated: boolean;
  has: (productId: string) => boolean;
  /** Returns true when the product is now saved. */
  toggle: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const EMPTY: string[] = [];
const parseIds = (value: unknown): string[] | null =>
  Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string"))] : null;

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds, hydrated] = usePersistentState("mithren.wishlist", EMPTY, parseIds);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      hydrated,
      has: (productId) => ids.includes(productId),
      toggle: (productId) => {
        const saved = !ids.includes(productId);
        setIds((current) => (saved ? [...current.filter((id) => id !== productId), productId] : current.filter((id) => id !== productId)));
        return saved;
      },
    }),
    [ids, hydrated, setIds],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const wishlist = useContext(WishlistContext);
  if (!wishlist) throw new Error("useWishlist must be used inside WishlistProvider");
  return wishlist;
}
