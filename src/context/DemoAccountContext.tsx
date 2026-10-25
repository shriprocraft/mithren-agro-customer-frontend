"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { bundles } from "@/data/bundles";
import { demoAddress, demoPreferences, demoProfile } from "@/data/demo-account";
import { products } from "@/data/products";
import { useAddressBook } from "@/context/AddressBookContext";
import { useOrders } from "@/context/OrdersContext";
import { usePersistentState } from "@/hooks/usePersistentState";
import { buildSampleOrders, cleanProfile, parsePreferences, parseProfile, parseSession } from "@/lib/demo-account";
import type { AccountPreferences, CustomerProfile, DemoSession } from "@/types/account";

// DEMO ACCOUNT (docs/DEMO_ACCOUNT.md). Not authentication: there are no credentials, tokens or
// server, and the stored session marker is only a flag saying the visitor chose to explore the demo.
// Client-side gating with it is a user-experience feature, never security. A real implementation
// replaces this provider with a server-verified session (see CustomerAccountService in types/account).
//
// Starting the demo adds fictional sample orders and a sample address to the browser's existing order
// and address stores (so checkout, tracking and the account share one source of truth); ending it
// removes those samples and the demo profile and preferences. Orders placed, addresses added and the
// cart and wishlist belong to this browser, not to the demo account, so they are kept.
interface DemoAccountValue {
  session: DemoSession | null;
  isActive: boolean;
  /** False until browser storage has been read; show a loading state until then. */
  hydrated: boolean;
  profile: CustomerProfile;
  preferences: AccountPreferences;
  startDemoSession: () => void;
  endDemoSession: () => void;
  /** Saves a validated profile; returns false if it could not be stored. */
  updateProfile: (profile: CustomerProfile) => boolean;
  updatePreferences: (preferences: AccountPreferences) => boolean;
  /** Restores the demo profile, preferences and sample orders and address. */
  resetDemoData: () => void;
}

const DemoAccountContext = createContext<DemoAccountValue | null>(null);
const catalog = [...products, ...bundles];

export function DemoAccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession, hydrated] = usePersistentState<DemoSession | null>("mithren.demo-session", null, parseSession);
  const [profile, setProfile] = usePersistentState("mithren.demo-profile", demoProfile, parseProfile);
  const [preferences, setPreferences] = usePersistentState("mithren.demo-preferences", demoPreferences, parsePreferences);
  const orders = useOrders();
  const book = useAddressBook();

  const value = useMemo<DemoAccountValue>(() => {
    const seedSamples = () => {
      orders.removeSamples();
      book.removeSamples();
      const address = book.addSample(demoAddress);
      // Becomes the default unless the visitor already chose one of their own addresses.
      const currentDefault = book.addresses.find((a) => a.id === book.defaultId);
      if (!currentDefault || currentDefault.is_sample) book.setDefault(address.id);
      orders.addSamples(buildSampleOrders(catalog, address, new Date(), new Set(orders.orders.map((o) => o.id))));
    };
    const clearDemo = () => {
      orders.removeSamples();
      book.removeSamples();
      setProfile(demoProfile);
      setPreferences(demoPreferences);
    };
    return {
      session,
      isActive: session !== null,
      hydrated,
      profile,
      preferences,
      startDemoSession: () => {
        if (session) return;
        clearDemo();
        seedSamples();
        setSession({ kind: "demo", started_at: new Date().toISOString() });
      },
      endDemoSession: () => {
        clearDemo();
        setSession(null);
      },
      updateProfile: (next) => setProfile(cleanProfile(next)),
      updatePreferences: (next) => setPreferences(next),
      resetDemoData: () => {
        clearDemo();
        seedSamples();
      },
    };
  }, [session, hydrated, profile, preferences, orders, book, setSession, setProfile, setPreferences]);

  return <DemoAccountContext.Provider value={value}>{children}</DemoAccountContext.Provider>;
}

export function useDemoAccount() {
  const account = useContext(DemoAccountContext);
  if (!account) throw new Error("useDemoAccount must be used inside DemoAccountProvider");
  return account;
}
