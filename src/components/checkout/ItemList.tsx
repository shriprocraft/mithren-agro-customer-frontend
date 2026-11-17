import Link from "next/link";
import { Star } from "lucide-react";
import { CatalogImage } from "@/components/products/CatalogImage";
import { formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export interface ItemRow {
  /** Unique per line (product + option). */
  key: string;
  product_id: string;
  name: string;
  /** Pack size and option, e.g. "500 g" or "2-piece set · Size M". */
  unit: string;
  image: { src: string; alt: string; studio?: boolean };
  /** Paise. */
  unit_price: number;
  quantity: number;
  /** Paise. */
  line_total: number;
  /** Shows "Write a review" (orders: products from an order that isn't cancelled). */
  reviewable?: boolean;
  /** Split orders: where this item's seller has got; `dropped` when the seller rejected or cancelled it. */
  status?: { label: string; dropped: boolean };
}

/** Read-only list of items with thumbnail, pack size, quantity and line total (review, confirmation, tracking). */
export function ItemList({ items, label }: { items: ItemRow[]; label: string }) {
  return (
    <ul aria-label={label} className="divide-y">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-4 py-3">
          <div className={cn("relative size-16 shrink-0 overflow-hidden rounded-xl", item.image.studio ? "bg-white ring-1 ring-border" : "bg-muted")}>
            <CatalogImage image={item.image} alt="" sizes="64px" />
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/products/${item.product_id}`} className="font-medium hover:text-primary hover:underline">{item.name}</Link>
            <p className="text-sm text-muted-foreground">
              {item.unit} · Qty {item.quantity} × {formatPrice(item.unit_price)}
            </p>
            {item.status && (
              <p
                className={cn(
                  "mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                  item.status.dropped ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground",
                )}
              >
                {item.status.label}
                {item.status.dropped && " · not delivered or charged"}
              </p>
            )}
            {item.reviewable && (
              <Link href={`/products/${item.product_id}#reviews`} className="mt-0.5 inline-flex min-h-8 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
                <Star className="size-3.5" aria-hidden="true" />Write a review<span className="sr-only">: {item.name}</span>
              </Link>
            )}
          </div>
          <p className={cn("font-heading font-semibold", item.status?.dropped && "text-muted-foreground line-through")}>
            {formatPrice(item.line_total)}
            {item.status?.dropped && <span className="sr-only"> (not charged)</span>}
          </p>
        </li>
      ))}
    </ul>
  );
}
