import { AddToCartButton } from "@/components/products/AddToCartButton";
import { CatalogImage } from "@/components/products/CatalogImage";
import { PriceDisplay } from "@/components/products/PriceDisplay";
import { ProductLink } from "@/components/products/ProductLink";
import { StockBadge } from "@/components/products/StockBadge";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

interface CompactProductCardProps {
  product: Product;
  vendorName: string;
  className?: string;
}

// Horizontal card for editorial sections (seasonal list, farm essentials). The cart button keeps its
// natural width, so a stack of these cards reads as a list rather than a wall of green buttons.
export function CompactProductCard({ product, vendorName, className }: CompactProductCardProps) {
  const image = product.images[0];

  return (
    <article className={cn("surface-card relative flex gap-3 rounded-2xl p-2.5 text-card-foreground", className)}>
      <div className={cn("relative size-24 shrink-0 overflow-hidden rounded-xl sm:size-26", image?.studio ? "bg-white" : "bg-muted")}>
        {image && <CatalogImage image={image} sizes="112px" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          <ProductLink productId={product.id}>
            {product.name}
          </ProductLink>
        </h3>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{product.unit} · {vendorName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <PriceDisplay price={product.price} discountedPrice={product.discounted_price} />
          <StockBadge status={product.stock_status} />
        </div>
        <div className="relative z-10 mt-auto pt-2">
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            stockStatus={product.stock_status}
            className="w-fit px-4"
          />
        </div>
      </div>
    </article>
  );
}
