import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatters";

interface PriceDisplayProps {
  price: number;
  discountedPrice?: number;
  /** Sizes are relative, so a text-* class here scales both prices. */
  className?: string;
}

export function PriceDisplay({ price, discountedPrice, className }: PriceDisplayProps) {
  const onSale = discountedPrice !== undefined && discountedPrice < price;

  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-1.5 text-[0.9375rem]", className)}>
      <span className="font-heading font-semibold text-foreground">
        <span className="sr-only">{onSale ? "Sale price " : "Price "}</span>
        {formatPrice(onSale ? discountedPrice : price)}
      </span>
      {onSale && (
        <span className="text-[0.8em] text-muted-foreground line-through">
          <span className="sr-only">Previous price </span>
          {formatPrice(price)}
        </span>
      )}
    </p>
  );
}
