"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { AddressBookProvider } from "@/context/AddressBookContext";
import { AnnouncerProvider } from "@/context/AnnouncerContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { CheckoutProvider } from "@/context/CheckoutContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { ToastProvider } from "@/context/ToastContext";
import { WishlistProvider } from "@/context/WishlistContext";
import type { OrdersService } from "@/services/orders";
import type { WishlistService } from "@/services/wishlist";
import type { AuthService } from "@/types/auth";

// Mounted once in the root layout (guide, Section J). MotionConfig honours the OS reduced-motion setting.
// Each provider owns one kind of client state (docs/ARCHITECTURE.md, "State and persistence").
export function AppProviders({
  children,
  authService,
  ordersService,
  wishlistService,
}: {
  children: ReactNode;
  authService?: AuthService;
  ordersService?: OrdersService | null;
  wishlistService?: WishlistService | null;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <AnnouncerProvider>
        <ToastProvider>
          <CartProvider>
            {/* Outside the address book and wishlist: both come from the account once signed in. */}
            <AuthProvider service={authService}>
              <WishlistProvider {...(wishlistService !== undefined && { service: wishlistService })}>
                <AddressBookProvider>
                  <CheckoutProvider>
                    <OrdersProvider {...(ordersService !== undefined && { service: ordersService })}>{children}</OrdersProvider>
                  </CheckoutProvider>
                </AddressBookProvider>
              </WishlistProvider>
            </AuthProvider>
          </CartProvider>
        </ToastProvider>
      </AnnouncerProvider>
    </MotionConfig>
  );
}
