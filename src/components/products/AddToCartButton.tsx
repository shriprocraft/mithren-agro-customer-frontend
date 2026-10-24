"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import type { StockStatus } from "@/types/catalog";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  stockStatus: StockStatus;
  className?: string;
}

const FEEDBACK_MS = 1600;

export function AddToCartButton({ productId, productName, stockStatus, className }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const announce = useAnnounce();
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (stockStatus === "out_of_stock") {
    return (
      <Button variant="secondary" disabled className={cn("w-full", className)}>
        Out of stock
      </Button>
    );
  }

  const handleAdd = () => {
    if (addItem(productId) === "limit_reached") {
      announce(`You can add up to 20 of ${productName} in this preview.`);
      return;
    }
    announce(`${productName} added to cart.`);
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
      <span className="sr-only">: {productName}</span>
    </Button>
  );
}
