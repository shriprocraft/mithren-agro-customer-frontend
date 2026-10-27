"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Store, Zap } from "lucide-react";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { PriceDisplay } from "@/components/products/PriceDisplay";
import { QuantityStepper } from "@/components/products/QuantityStepper";
import { StockBadge } from "@/components/products/StockBadge";
import { Button } from "@/components/ui/button";
import { useCheckout } from "@/context/CheckoutContext";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart";
import { effectivePrice, formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { defaultVariant, hasVariants, resolveSelection, variantTypeLabels } from "@/lib/variants";
import type { Product } from "@/types/catalog";

// Price, availability, options, quantity, Add to cart and Buy now for the product details page (the
// wishlist heart sits on the image). Everything below follows the chosen option: its price, pack size
// and stock, and the option is what Add to cart and Buy now buy. Out-of-stock options stay visible but
// can't be chosen. "Buy now" checks out just this option at the chosen quantity and leaves the cart as
// it is; it is the logo-gold action and shows a spinner until checkout has opened. The two buttons
// share one row at every width, so both stay on the first screen on phones.
export function PurchasePanel({ product, seller }: { product: Product; seller?: string }) {
  const router = useRouter();
  const { start } = useCheckout();
  const [variantId, setVariantId] = useState(() => defaultVariant(product)?.id);
  const [quantity, setQuantity] = useState(1);
  const [opening, startOpening] = useTransition();
  // A missing option (catalogue changed under an open page) falls back to the default one.
  const selection = resolveSelection(product, variantId) ?? resolveSelection(product)!;
  const outOfStock = selection.stock_status === "out_of_stock";
  const saving = selection.discounted_price !== undefined && selection.discounted_price < selection.price ? selection.price - selection.discounted_price : 0;

  const buyNow = () => {
    start({ kind: "buy_now", product_id: product.id, ...(selection.variant && { variant_id: selection.variant.id }), quantity });
    startOpening(() => router.push("/checkout/address"));
  };

  return (
    <div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <PriceDisplay price={selection.price} discountedPrice={selection.discounted_price} className="text-[1.75rem]" />
        <span className="text-sm text-muted-foreground">per {selection.description}</span>
        {saving > 0 && (
          <span className="rounded-full bg-highlight/60 px-2.5 py-0.5 text-xs font-semibold text-foreground">You save {formatPrice(saving)}</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <StockBadge status={selection.stock_status} className="text-sm" />
        {seller && (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Store className="size-4" aria-hidden="true" />
            Sold by <span className="font-medium text-foreground">{seller}</span>
          </span>
        )}
      </div>

      <div className="mt-5 space-y-4 border-t border-border pt-5">
        {hasVariants(product) && product.variants.length > 1 && (
          <fieldset>
            <legend className="text-sm font-semibold">
              {variantTypeLabels[product.variant_type ?? "pack"]}
              <span className="ml-2 font-normal text-muted-foreground">{selection.variant?.label}</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.variants.map((variant) => {
                const unavailable = variant.stock_status === "out_of_stock";
                const checked = variant.id === selection.variant?.id;
                return (
                  <label
                    key={variant.id}
                    className={cn(
                      "relative inline-flex min-h-11 min-w-14 cursor-pointer flex-col items-center justify-center rounded-2xl border px-3.5 py-1.5 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2",
                      checked ? "border-primary bg-secondary font-semibold text-secondary-foreground" : "border-input/50 bg-card hover:border-primary/50 hover:bg-soft",
                      unavailable && "cursor-not-allowed border-dashed text-muted-foreground opacity-70 hover:border-input/50 hover:bg-card",
                    )}
                  >
                    <input
                      type="radio"
                      name={`option-${product.id}`}
                      value={variant.id}
                      checked={checked}
                      disabled={unavailable}
                      onChange={() => setVariantId(variant.id)}
                      className="sr-only"
                    />
                    <span className={cn(unavailable && "line-through")}>{variant.label}</span>
                    {product.variant_type !== "size" && (
                      <span className="text-xs font-normal text-muted-foreground">{formatPrice(effectivePrice(variant))}</span>
                    )}
                    {unavailable && <span className="sr-only"> (out of stock)</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {outOfStock ? (
          <p role="status" className="rounded-2xl border border-border bg-secondary p-3 text-sm text-secondary-foreground">
            {hasVariants(product)
              ? "This option is out of stock. Choose another option, or tap the heart to save the product to your wishlist."
              : "This item is out of stock and can’t be bought right now. Tap the heart to save it to your wishlist."}
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <QuantityStepper value={quantity} onChange={setQuantity} label={`Quantity of ${product.name}`} />
            <p className="text-right text-sm text-muted-foreground">
              Total <span className="font-semibold text-foreground">{formatPrice(effectivePrice(selection) * quantity)}</span>
              <span className="block text-xs">Up to {MAX_QUANTITY_PER_ITEM} per order in this preview</span>
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            variantId={selection.variant?.id}
            defaultVariantId={defaultVariant(product)?.id}
            optionLabel={selection.variant ? selection.description : undefined}
            stockStatus={selection.stock_status}
            quantity={quantity}
            className="h-12 px-3"
          />
          <Button variant="buy" className="h-12 px-3" disabled={outOfStock} loading={opening} onClick={buyNow}>
            {!opening && <Zap aria-hidden="true" />}
            Buy now
          </Button>
        </div>
      </div>
    </div>
  );
}
