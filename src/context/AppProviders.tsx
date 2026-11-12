"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { AddressBookProvider } from "@/context/AddressBookContext";
import { AnnouncerProvider } from "@/context/AnnouncerContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { CheckoutProvider } from "@/context/CheckoutContext";
import { DemoAccountProvider } from "@/context/DemoAccountContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { ToastProvider } from "@/context/ToastContext";
import { WishlistProvider } from "@/context/WishlistContext";
import type { OrdersService } from "@/services/orders";
import type { AuthService } from "@/types/auth";

// Mounted once in the root layout (guide, Section J). MotionConfig honours the OS reduced-motion setting.
// Each provider owns one kind of client state (docs/ARCHITECTURE.md, "State and persistence").
export function AppProviders({ children, authService, ordersService }: { children: ReactNode; authService?: AuthService; ordersService?: OrdersService | null }) {
  return (
    <MotionConfig reducedMotion="user">
      <AnnouncerProvider>
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              {/* Outside the address book: a signed-in customer's addresses come from their account. */}
              <AuthProvider service={authService}>
                <AddressBookProvider>
                  <CheckoutProvider>
                    <OrdersProvider {...(ordersService !== undefined && { service: ordersService })}>
                      {/* Inside the order and address stores: the demo account adds its samples to them. */}
                      <DemoAccountProvider>{children}</DemoAccountProvider>
                    </OrdersProvider>
                  </CheckoutProvider>
                </AddressBookProvider>
              </AuthProvider>
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </AnnouncerProvider>
    </MotionConfig>
  );
}
