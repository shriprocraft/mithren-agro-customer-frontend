"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { AddressBookProvider } from "@/context/AddressBookContext";
import { AnnouncerProvider } from "@/context/AnnouncerContext";
import { CartProvider } from "@/context/CartContext";
import { CheckoutProvider } from "@/context/CheckoutContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { WishlistProvider } from "@/context/WishlistContext";

// Mounted once in the root layout (guide, Section J). MotionConfig honours the OS reduced-motion setting.
// Each provider owns one kind of client state (docs/ARCHITECTURE.md, "State and persistence").
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AnnouncerProvider>
        <CartProvider>
          <WishlistProvider>
            <AddressBookProvider>
              <CheckoutProvider>
                <OrdersProvider>{children}</OrdersProvider>
              </CheckoutProvider>
            </AddressBookProvider>
          </WishlistProvider>
        </CartProvider>
      </AnnouncerProvider>
    </MotionConfig>
  );
}
