import Link from "next/link";
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
}

/** Read-only list of items with thumbnail, pack size, quantity and line total (review, confirmation, tracking). */
export function ItemList({ items, label }: { items: ItemRow[]; label: string }) {
  return (
    <ul aria-label={label} className="divide-y">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-4 py-3">
          <div className={cn("relative size-16 shrink-0 overflow-hidden rounded-xl", item.image.studio ? "bg-white ring-1 ring-border" : "bg-muted")}>
            {item.image.src && <CatalogImage image={item.image} alt="" sizes="64px" />}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/products/${item.product_id}`} className="font-medium hover:text-primary hover:underline">{item.name}</Link>
            <p className="text-sm text-muted-foreground">
              {item.unit} · Qty {item.quantity} × {formatPrice(item.unit_price)}
            </p>
          </div>
          <p className="font-heading font-semibold">{formatPrice(item.line_total)}</p>
        </li>
      ))}
    </ul>
  );
}
