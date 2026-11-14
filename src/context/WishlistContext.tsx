"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth, useBackendCustomerId } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { usePersistentState } from "@/hooks/usePersistentState";
import { wishlistService as defaultWishlistService, type WishlistService } from "@/services/wishlist";

// One wishlist behind one interface:
// - signed in: the customer's account wishlist on the backend. On
//   sign-in, hearts saved in this browser are added to the account (never removing any) and then cleared
//   here, so the account is the one list from then on;
// - guests: saved in this browser's localStorage (product ids from the backend catalogue).
interface WishlistContextValue {
  ids: string[];
  hydrated: boolean;
  has: (productId: string) => boolean;
  /** Returns true when the product is now saved. In the account the change shows at once and is undone if the store refuses it. */
  toggle: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const EMPTY: string[] = [];
const parseIds = (value: unknown): string[] | null =>
  Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string"))] : null;

type AccountList = { customerId: string; ids: string[]; loaded: boolean };

export function WishlistProvider({ children, service = defaultWishlistService }: { children: ReactNode; service?: WishlistService | null }) {
  const [ids, setIds, hydrated] = usePersistentState("mithren.wishlist", EMPTY, parseIds);
  const customerId = useBackendCustomerId();
  // Until sign-in is known, a customer's list could be either one: show neither yet.
  const authStatus = useAuth().status;
  const sessionPending = Boolean(service) && authStatus === "loading";
  const backend = service && customerId ? service : null;
  const toast = useToast();
  const [account, setAccount] = useState<AccountList | null>(null);
  // The browser list as it was when the customer signed in (read once, after storage has loaded).
  const browserIds = useRef<string[]>(ids);
  useEffect(() => {
    browserIds.current = ids;
  }, [ids]);

  useEffect(() => {
    if (!backend || !customerId || !hydrated) return;
    let live = true;
    const local = browserIds.current;
    const load = local.length > 0 ? backend.merge(local) : backend.list();
    load.then(
      (list) => {
        if (!live) return;
        setAccount({ customerId, ids: list, loaded: true });
        if (local.length > 0) setIds([]); // now in the account
      },
      () => {
        if (!live) return;
        // Keep the browser list so nothing is lost; the account list stays empty until the next load.
        setAccount({ customerId, ids: [], loaded: true });
        toast.error("Your wishlist couldn't be loaded", { id: "wishlist:load", description: "Check your connection and reload the page." });
      },
    );
    return () => {
      live = false;
    };
  }, [backend, customerId, hydrated, setIds, toast]);

  const accountList = backend && account?.customerId === customerId ? account : null;

  const value = useMemo<WishlistContextValue>(() => {
    if (!backend) {
      return {
        ids,
        hydrated: hydrated && !sessionPending,
        has: (productId) => ids.includes(productId),
        toggle: (productId) => {
          const saved = !ids.includes(productId);
          setIds((current) => (saved ? [...current.filter((id) => id !== productId), productId] : current.filter((id) => id !== productId)));
          return saved;
        },
      };
    }
    const list = accountList?.ids ?? EMPTY;
    const change = (update: (current: string[]) => string[]) =>
      setAccount((current) => (current && current.customerId === customerId ? { ...current, ids: update(current.ids) } : current));
    return {
      ids: list,
      hydrated: Boolean(accountList?.loaded),
      has: (productId) => list.includes(productId),
      toggle: (productId) => {
        const saved = !list.includes(productId);
        change((current) => (saved ? [productId, ...current.filter((id) => id !== productId)] : current.filter((id) => id !== productId)));
        (saved ? backend.add(productId) : backend.remove(productId)).catch(() => {
          // Put it back as it was, and say so in place of the confirmation.
          change((current) => (saved ? current.filter((id) => id !== productId) : [productId, ...current.filter((id) => id !== productId)]));
          toast.error("Your wishlist couldn't be updated", { id: `wishlist:${productId}`, description: "Please try again." });
        });
        return saved;
      },
    };
  }, [backend, ids, hydrated, sessionPending, setIds, accountList, customerId, toast]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const wishlist = useContext(WishlistContext);
  if (!wishlist) throw new Error("useWishlist must be used inside WishlistProvider");
  return wishlist;
}
