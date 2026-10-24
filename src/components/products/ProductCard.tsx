import { AddToCartButton } from "@/components/products/AddToCartButton";
import { CatalogImage } from "@/components/products/CatalogImage";
import { PriceDisplay } from "@/components/products/PriceDisplay";
import { ProductQuickView } from "@/components/products/ProductQuickView";
import { StockBadge } from "@/components/products/StockBadge";
import { WishlistButton } from "@/components/products/WishlistButton";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

interface ProductCardProps {
  product: Product;
  vendorName: string;
  /** Apparel uses portrait imagery; produce and pantry items use square. */
  imageShape?: "square" | "portrait";
  sizes?: string;
  className?: string;
}

// Compact card from the reference. The product name opens the quick view and stretches over
// the whole card; the wishlist and cart buttons sit above that layer so each keeps its own target.
export function ProductCard({
  product,
  vendorName,
  imageShape = "square",
  sizes = "(min-width: 1280px) 240px, (min-width: 640px) 33vw, 50vw",
  className,
}: ProductCardProps) {
  const image = product.images[0];

  return (
    <article
      className={cn(
        "group surface-card relative flex h-full flex-col rounded-2xl p-2 transition duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {/* Studio cut-outs sit on a white surface with a hairline edge, as in the reference. */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl",
          image?.studio ? "bg-white shadow-[inset_0_0_0_1px_var(--border)]" : "bg-muted",
          imageShape === "portrait" ? "aspect-[4/5]" : "aspect-square",
        )}
      >
        {image && (
          <CatalogImage
            image={image}
            sizes={sizes}
            className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        )}
        {product.is_seasonal && (
          <span className="absolute top-2 left-2 rounded-full bg-card/95 px-2.5 py-0.5 shadow-card text-[0.6875rem] font-medium text-brand">
            Seasonal
          </span>
        )}
      </div>
      <WishlistButton productId={product.id} productName={product.name} className="absolute top-1 right-1 z-10" />
      <div className="flex flex-1 flex-col px-1.5 pt-2.5">
        <h3 className="text-[0.8125rem] leading-snug font-medium text-foreground">
          <ProductQuickView product={product} vendorName={vendorName}>
            {product.name}
          </ProductQuickView>
        </h3>
        <p className="text-xs text-muted-foreground">{product.unit}</p>
        <p className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">Sold by {vendorName}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 pt-1.5">
          <PriceDisplay price={product.price} discountedPrice={product.discounted_price} />
          <StockBadge status={product.stock_status} />
        </div>
        <AddToCartButton
          productId={product.id}
          productName={product.name}
          stockStatus={product.stock_status}
          className="relative z-10 mt-2.5 mb-0.5"
        />
      </div>
    </article>
  );
}
