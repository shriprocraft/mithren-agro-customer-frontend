"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { QuantityStepper } from "@/components/products/QuantityStepper";
import { Button } from "@/components/ui/button";
import { useCheckout } from "@/context/CheckoutContext";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart";
import { formatPrice, effectivePrice } from "@/lib/formatters";
import type { Product } from "@/types/catalog";

// Quantity, Add to cart and Buy now for the product details page (the wishlist heart sits on the
// image). "Buy now" checks out just this product at the chosen quantity and leaves the cart as it is.
// The two buttons share one row at every width, so both stay on the first screen on phones.
export function PurchasePanel({ product }: { product: Product }) {
  const router = useRouter();
  const { start } = useCheckout();
  const [quantity, setQuantity] = useState(1);
  const outOfStock = product.stock_status === "out_of_stock";

  const buyNow = () => {
    start({ kind: "buy_now", product_id: product.id, quantity });
    router.push("/checkout/address");
  };

  return (
    <div className="space-y-4">
      {outOfStock ? (
        <p role="status" className="rounded-2xl border border-border bg-secondary p-3 text-sm text-secondary-foreground">
          This item is out of stock and can’t be bought right now. Tap the heart to save it to your wishlist.
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper value={quantity} onChange={setQuantity} label={`Quantity of ${product.name}`} />
          <p className="text-right text-sm text-muted-foreground">
            Total <span className="font-semibold text-foreground">{formatPrice(effectivePrice(product) * quantity)}</span>
            <span className="block text-xs">Up to {MAX_QUANTITY_PER_ITEM} per order in this preview</span>
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <AddToCartButton productId={product.id} productName={product.name} stockStatus={product.stock_status} quantity={quantity} className="h-12 px-3" />
        <Button variant="outline" className="h-12 px-3" disabled={outOfStock} onClick={buyNow}>
          <Zap aria-hidden="true" />
          Buy now
        </Button>
      </div>
    </div>
  );
}
