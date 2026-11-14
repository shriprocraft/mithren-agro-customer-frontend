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
import type { CartService } from "@/services/cart";
import type { OrdersService } from "@/services/orders";
import type { WishlistService } from "@/services/wishlist";
import type { AuthService } from "@/types/auth";

// Mounted once in the root layout (guide, Section J). MotionConfig honours the OS reduced-motion setting.
// Each provider owns one kind of client state (docs/ARCHITECTURE.md, "State and persistence").
export function AppProviders({
  children,
  authService,
  cartService,
  ordersService,
  wishlistService,
}: {
  children: ReactNode;
  authService?: AuthService;
  cartService?: CartService | null;
  ordersService?: OrdersService | null;
  wishlistService?: WishlistService | null;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <AnnouncerProvider>
        <ToastProvider>
          {/* Outside the cart, address book and wishlist: all three come from the account once signed in. */}
          <AuthProvider service={authService}>
            <CartProvider {...(cartService !== undefined && { service: cartService })}>
              <WishlistProvider {...(wishlistService !== undefined && { service: wishlistService })}>
                <AddressBookProvider>
                  <CheckoutProvider>
                    <OrdersProvider {...(ordersService !== undefined && { service: ordersService })}>{children}</OrdersProvider>
                  </CheckoutProvider>
                </AddressBookProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </AnnouncerProvider>
    </MotionConfig>
  );
}
