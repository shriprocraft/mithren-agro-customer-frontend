import Link from "next/link";
import { ArrowRight, ChevronDown, Package } from "lucide-react";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { CatalogImage } from "@/components/products/CatalogImage";
import { PriceDisplay } from "@/components/products/PriceDisplay";
import { ProductLink } from "@/components/products/ProductLink";
import { StockBadge } from "@/components/products/StockBadge";
import { effectivePrice, formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

interface ComboCardProps {
  bundle: Product;
  vendorName: string;
  /** "box": price-led budget box (₹1,000 / ₹5,000 / ₹10,000). "offer": photo-led pack card. */
  layout: "offer" | "box";
}

/** Items listed before the rest fold into "Show all"; offers are short enough to list in full. */
const VISIBLE_ITEMS = 6;

// One combo: photo, badge, name, every included item with its quantity, the price (always the sum of
// the items at today's catalogue prices, lib/bundles.ts), availability, and Add to cart, which puts the
// whole box in the real cart as one line. The name is a stretched link to the box's details page;
// the contents toggle and the buttons sit above it (z-10) so they stay separately usable.
export function ComboCard({ bundle, vendorName, layout }: ComboCardProps) {
  const image = bundle.images[0];
  const contents = bundle.bundle_contents ?? [];
  const isBox = layout === "box";
  const visible = isBox ? contents.slice(0, VISIBLE_ITEMS) : contents;
  const folded = isBox ? contents.slice(VISIBLE_ITEMS) : [];
  const onSale = bundle.discounted_price !== undefined && bundle.discounted_price < bundle.price;
  const titleId = `combo-${bundle.id}`;

  return (
    <article aria-labelledby={titleId} className="surface-card relative flex h-full flex-col overflow-hidden rounded-3xl">
      {isBox && (
        <div className="flex items-baseline justify-between gap-3 bg-secondary px-5 pt-4 pb-3 text-secondary-foreground">
          <p className="font-heading text-3xl font-semibold tracking-tight sm:text-[2rem]">
            <span className="sr-only">Box price </span>
            {formatPrice(effectivePrice(bundle))}
          </p>
          {bundle.badge && <span className="text-xs font-semibold tracking-wide uppercase">{bundle.badge}</span>}
        </div>
      )}

      <div className={cn("relative overflow-hidden", isBox ? "aspect-[16/9]" : "aspect-[4/3]", image?.studio ? "bg-white" : "bg-muted")}>
        {image && <CatalogImage image={image} sizes={isBox ? "(min-width: 768px) 420px, 100vw" : "(min-width: 1024px) 420px, (min-width: 768px) 50vw, 100vw"} />}
        {!isBox && bundle.badge && (
          <span className="absolute top-3 left-3 rounded-full bg-highlight px-3 py-1 text-xs font-semibold text-foreground">{bundle.badge}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 id={titleId} className="font-heading text-lg leading-snug font-semibold sm:text-xl">
          <ProductLink productId={bundle.id}>{bundle.name}</ProductLink>
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{bundle.description}</p>

        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand uppercase">
            <Package className="size-3.5" aria-hidden="true" />
            What’s inside · {bundle.unit}
          </p>
          <ul aria-label={`${bundle.name} contents`} className="mt-2 grid gap-1 text-sm text-foreground">
            {visible.map((item) => (
              <ContentsItem key={item} item={item} />
            ))}
          </ul>
          {folded.length > 0 && (
            <details className="group/more relative z-10 mt-1">
              <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-1 rounded-full text-sm font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <span className="group-open/more:hidden">Show all {contents.length} items</span>
                <span className="hidden group-open/more:inline">Show fewer items</span>
                <ChevronDown className="size-4 transition-transform group-open/more:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
              </summary>
              <ul className="grid gap-1 pb-1 text-sm text-foreground">
                {folded.map((item) => (
                  <ContentsItem key={item} item={item} />
                ))}
              </ul>
            </details>
          )}
        </div>

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {isBox ? (
              <p className="text-xs text-muted-foreground">Sum of the items above at today’s prices</p>
            ) : (
              <PriceDisplay price={bundle.price} discountedPrice={bundle.discounted_price} className="text-xl" />
            )}
            <StockBadge status={bundle.stock_status} />
          </div>
          {onSale && (
            <p className="mt-1 text-xs text-muted-foreground">
              Includes current sale prices on some items{isBox && <> (list price {formatPrice(bundle.price)})</>}.
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Sold by {vendorName}</p>
          <div className="relative z-10 mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <AddToCartButton productId={bundle.id} productName={bundle.name} stockStatus={bundle.stock_status} />
            <Link
              href={`/products/${bundle.id}`}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-medium text-primary transition-colors outline-none hover:border-primary/35 hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring"
            >
              Details
              <span className="sr-only">: {bundle.name}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function ContentsItem({ item }: { item: string }) {
  const [name, ...rest] = item.split(", ");
  return (
    <li className="flex items-baseline justify-between gap-3 border-b border-dashed border-border py-1 last:border-0">
      <span>{name}</span>
      <span className="shrink-0 text-right text-xs text-muted-foreground">{rest.join(", ")}</span>
    </li>
  );
}

