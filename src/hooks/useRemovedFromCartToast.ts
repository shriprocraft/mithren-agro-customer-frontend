"use client";

import { useCallback } from "react";
import { useToast } from "@/context/ToastContext";

/** Feedback after removing a cart line (cart page and mini cart): confirms it, or says it wasn't saved. */
export function useRemovedFromCartToast() {
  const toast = useToast();
  return useCallback(
    (productName: string, persisted: boolean) => {
      if (persisted) toast.success("Removed from cart", { id: `cart-remove:${productName}`, description: productName });
      else toast.error("Change not saved", { id: `cart-remove:${productName}`, description: `${productName} was removed for this visit, but this browser isn’t letting us save the cart.` });
    },
    [toast],
  );
}
