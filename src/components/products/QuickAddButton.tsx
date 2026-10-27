import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { defaultVariant, resolveSelection } from "@/lib/variants";
import type { Product } from "@/types/catalog";

/**
 * The purchase button on product cards. Weight and pack options are added as listed (the card shows
 * that option's pack size and price, and the toast names it). Apparel is never added in a size the
 * shopper didn't pick, so sized products link to their page with "Choose size" instead.
 */
export function QuickAddButton({ product, className }: { product: Product; className?: string }) {
  if (product.variant_type === "size") {
    return (
      <Button asChild variant="outline" className={cn("w-full", className)}>
        <Link href={`/products/${product.id}`}>
          Choose size
          <ArrowRight aria-hidden="true" />
          <span className="sr-only">: {product.name}</span>
        </Link>
      </Button>
    );
  }
  const variant = defaultVariant(product);
  const selection = resolveSelection(product, variant?.id);
  return (
    <AddToCartButton
      productId={product.id}
      productName={product.name}
      variantId={variant?.id}
      defaultVariantId={variant?.id}
      optionLabel={variant ? selection?.description : undefined}
      stockStatus={selection?.stock_status ?? product.stock_status}
      className={className}
    />
  );
}
