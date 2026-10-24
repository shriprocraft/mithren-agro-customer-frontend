"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { AnnouncerProvider } from "@/context/AnnouncerContext";
import { BrowseProvider } from "@/context/BrowseContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

// Mounted once in the root layout (guide, Section J). MotionConfig honours the OS reduced-motion setting.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AnnouncerProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowseProvider>{children}</BrowseProvider>
          </WishlistProvider>
        </CartProvider>
      </AnnouncerProvider>
    </MotionConfig>
  );
}
