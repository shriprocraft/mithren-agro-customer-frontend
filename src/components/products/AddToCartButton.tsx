"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { limitMessage, MAX_QUANTITY_PER_ITEM, type QuantityLimits } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { lineKey } from "@/lib/variants";
import type { StockStatus } from "@/types/catalog";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  /** The chosen option, for products with options (cards pass the default one). */
  variantId?: string;
  /** The product's default option (see CartContext.addItem). */
  defaultVariantId?: string;
  /** Names the option in the toast and for screen readers, e.g. "500 g" or "2-piece set · Size: M". */
  optionLabel?: string;
  stockStatus: StockStatus;
  /** How many to add (product details page); defaults to 1. */
  quantity?: number;
  /** Stock and the seller's limits for one cart line (lib/cart.ts quantityLimits). */
  limits?: QuantityLimits;
  className?: string;
}

const FEEDBACK_MS = 1600;

export function AddToCartButton({ productId, productName, variantId, defaultVariantId, optionLabel, stockStatus, quantity = 1, limits, className }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const toast = useToast();
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (stockStatus === "out_of_stock" || (limits && limits.max < 1)) {
    return (
      <Button variant="secondary" disabled className={cn("w-full", className)}>
        Out of stock
      </Button>
    );
  }

  // The toast appears only after the cart has accepted the item. Its id is per product option, so repeated
  // clicks replace one notification instead of stacking several; the toast region announces it.
  const handleAdd = () => {
    const result = addItem(productId, quantity, variantId, defaultVariantId, limits?.max);
    const id = `cart:${lineKey(productId, variantId)}`;
    const name = optionLabel ? `${productName} (${optionLabel})` : productName;
    if (result === "limit_reached") {
      toast.error("Couldn’t add to cart", {
        id,
        description: limits
          ? `${limitMessage(limits)} of ${name}, and your cart already has that many.`
          : `You can add up to ${MAX_QUANTITY_PER_ITEM} of ${name}.`,
        action: { href: "/cart", label: "View cart" },
      });
      return;
    }
    if (result === "unsaved") {
      toast.info("Added for this visit only", {
        id,
        description: `${name} is in your cart, but this browser isn’t letting us save it. Check that site storage is enabled.`,
      });
    } else {
      toast.success("Added to cart successfully!", {
        id,
        description: quantity > 1 ? `${quantity} × ${name} are now in your cart.` : `${name} is now in your cart.`,
        action: { href: "/cart", label: "View cart" },
      });
    }
    setJustAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(false), FEEDBACK_MS);
  };

  return (
    <Button
      onClick={handleAdd}
      className={cn("w-full", justAdded && "bg-primary-hover hover:bg-primary-hover", className)}
    >
      {justAdded ? <Check aria-hidden="true" /> : <ShoppingCart aria-hidden="true" />}
      {justAdded ? "Added" : "Add to cart"}
      <span className="sr-only">: {productName}{optionLabel ? `, ${optionLabel}` : ""}</span>
    </Button>
  );
}
