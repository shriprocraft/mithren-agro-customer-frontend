import { AddToCartButton } from "@/components/products/AddToCartButton";
import { CatalogImage } from "@/components/products/CatalogImage";
import { PriceDisplay } from "@/components/products/PriceDisplay";
import { ProductQuickView } from "@/components/products/ProductQuickView";
import { StockBadge } from "@/components/products/StockBadge";
import type { Product } from "@/types/catalog";

// Wider than a product card so the box contents can be read at a glance.
export function BundleCard({ bundle, vendorName }: { bundle: Product; vendorName: string }) {
  const image = bundle.images[0];

  return (
    <article className="surface-card relative flex h-full flex-col rounded-3xl p-2">
      <div className={`relative aspect-[16/10] overflow-hidden rounded-2xl ${image?.studio ? "bg-white" : "bg-muted"}`}>
        {image && <CatalogImage image={image} sizes="(min-width: 768px) 400px, 100vw" />}
      </div>
      <div className="flex flex-1 flex-col px-3 pt-4 pb-2">
        <h3 className="font-heading text-lg font-semibold">
          <ProductQuickView product={bundle} vendorName={vendorName}>
            {bundle.name}
          </ProductQuickView>
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {bundle.unit} · {vendorName}
        </p>
        {bundle.bundle_contents && (
          <ul aria-label="Box contents" className="mt-4 flex flex-wrap gap-1.5">
            {bundle.bundle_contents.map((item) => (
              <li key={item} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {item}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-5">
          <PriceDisplay price={bundle.price} discountedPrice={bundle.discounted_price} />
          <StockBadge status={bundle.stock_status} />
        </div>
        <AddToCartButton
          productId={bundle.id}
          productName={bundle.name}
          stockStatus={bundle.stock_status}
          className="relative z-10 mt-4"
        />
      </div>
    </article>
  );
}
