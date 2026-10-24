"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

// Frontend-only wishlist for the preview. Saved items are lost on refresh.
interface WishlistContextValue {
  ids: string[];
  has: (productId: string) => boolean;
  /** Returns true when the product is now saved. */
  toggle: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      has: (productId) => ids.includes(productId),
      toggle: (productId) => {
        const saved = !ids.includes(productId);
        setIds(saved ? [...ids, productId] : ids.filter((id) => id !== productId));
        return saved;
      },
    }),
    [ids],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const wishlist = useContext(WishlistContext);
  if (!wishlist) throw new Error("useWishlist must be used inside WishlistProvider");
  return wishlist;
}
