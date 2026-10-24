"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { clampQuantity } from "@/lib/cart";
import type { CheckoutSession, CheckoutSource } from "@/types/order";

// The in-progress checkout: what is being bought and which saved address it goes to. Kept in
// sessionStorage, so it survives a refresh and the back button but ends with the browser tab.
interface CheckoutValue {
  session: CheckoutSession;
  hydrated: boolean;
  start: (source: CheckoutSource) => void;
  selectAddress: (addressId: string | null) => void;
  /** Called once an order has been placed. */
  finish: () => void;
}

const CheckoutContext = createContext<CheckoutValue | null>(null);
const DEFAULT: CheckoutSession = { source: { kind: "cart" }, address_id: null };

function parseSession(value: unknown): CheckoutSession | null {
  if (typeof value !== "object" || value === null) return null;
  const { source, address_id } = value as CheckoutSession;
  const addressId = typeof address_id === "string" ? address_id : null;
  if (source?.kind === "cart") return { source: { kind: "cart" }, address_id: addressId };
  if (source?.kind === "buy_now" && typeof source.product_id === "string" && Number.isInteger(source.quantity)) {
    return { source: { kind: "buy_now", product_id: source.product_id, quantity: clampQuantity(source.quantity) }, address_id: addressId };
  }
  return null;
}

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [session, setSession, hydrated] = usePersistentState("mithren.checkout", DEFAULT, parseSession, "session");

  const value = useMemo<CheckoutValue>(
    () => ({
      session,
      hydrated,
      start: (source) => setSession((current) => ({ ...current, source })),
      selectAddress: (addressId) => setSession((current) => ({ ...current, address_id: addressId })),
      finish: () => setSession((current) => ({ source: { kind: "cart" }, address_id: current.address_id })),
    }),
    [session, hydrated, setSession],
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout() {
  const checkout = useContext(CheckoutContext);
  if (!checkout) throw new Error("useCheckout must be used inside CheckoutProvider");
  return checkout;
}
