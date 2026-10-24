import { AddToCartButton } from "@/components/products/AddToCartButton";
import { CatalogImage } from "@/components/products/CatalogImage";
import { PriceDisplay } from "@/components/products/PriceDisplay";
import { ProductQuickView } from "@/components/products/ProductQuickView";
import { StockBadge } from "@/components/products/StockBadge";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

interface CompactProductCardProps {
  product: Product;
  vendorName: string;
  className?: string;
}

// Horizontal card for editorial sections (seasonal list, farm essentials).
export function CompactProductCard({ product, vendorName, className }: CompactProductCardProps) {
  const image = product.images[0];

  return (
    <article className={cn("surface-card relative flex gap-3 rounded-2xl p-2.5 text-card-foreground", className)}>
      <div className={cn("relative size-24 shrink-0 overflow-hidden rounded-xl sm:size-26", image?.studio ? "bg-white" : "bg-muted")}>
        {image && <CatalogImage image={image} sizes="112px" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-sm font-medium leading-snug">
          <ProductQuickView product={product} vendorName={vendorName}>
            {product.name}
          </ProductQuickView>
        </h3>
        <p className="text-xs text-muted-foreground">{product.unit}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <PriceDisplay price={product.price} discountedPrice={product.discounted_price} />
          <StockBadge status={product.stock_status} />
        </div>
        <div className="relative z-10 mt-auto pt-2">
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            stockStatus={product.stock_status}
            className="sm:w-fit"
          />
        </div>
      </div>
    </article>
  );
}
