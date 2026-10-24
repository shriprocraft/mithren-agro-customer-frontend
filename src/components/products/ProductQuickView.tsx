"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { CatalogImage } from "@/components/products/CatalogImage";
import { PriceDisplay } from "@/components/products/PriceDisplay";
import { StockBadge } from "@/components/products/StockBadge";
import { WishlistButton } from "@/components/products/WishlistButton";
import type { Product } from "@/types/catalog";

interface ProductQuickViewProps {
  product: Product;
  vendorName: string;
  /** The visible trigger content, usually the product name. */
  children: ReactNode;
}

// Product pages are not part of this phase, so cards open a quick view instead of a dead link.
export function ProductQuickView({ product, vendorName, children }: ProductQuickViewProps) {
  const image = product.images[0];

  return (
    <Dialog>
      <DialogTrigger className="text-left outline-none after:absolute after:inset-0 after:z-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring">
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        <div className="grid md:grid-cols-2">
          {image && (
            <div className={`relative aspect-square md:aspect-auto md:min-h-full ${image.studio ? "bg-white" : "bg-muted"}`}>
              <CatalogImage image={image} sizes="(min-width: 768px) 384px, 100vw" />
            </div>
          )}
          <div className="flex flex-col gap-4 p-6">
            <div className="space-y-2 pr-8">
              <DialogTitle className="text-2xl leading-tight">{product.name}</DialogTitle>
              <DialogDescription>
                {product.unit} · Sold by {vendorName}
              </DialogDescription>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PriceDisplay price={product.price} discountedPrice={product.discounted_price} className="text-xl" />
              <StockBadge status={product.stock_status} />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            {product.bundle_contents && (
              <div>
                <p className="text-sm font-medium">Box contents</p>
                <p className="text-sm text-muted-foreground">{product.bundle_contents.join(", ")}</p>
              </div>
            )}
            <div className="mt-auto flex flex-col gap-2 sm:flex-row">
              <AddToCartButton
                productId={product.id}
                productName={product.name}
                stockStatus={product.stock_status}
                className="sm:w-auto sm:flex-1"
              />
              <WishlistButton productId={product.id} productName={product.name} appearance="labelled" className="shrink-0" />
            </div>
            <p className="flex gap-2 rounded-xl bg-secondary p-3 text-xs text-secondary-foreground">
              <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
              Sample listing for this preview. Full product pages, delivery estimates and checkout are not available yet.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
