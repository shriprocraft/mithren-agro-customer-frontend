import type { ReactNode } from "react";
import { formatPrice } from "@/lib/formatters";

interface OrderSummaryProps {
  /** Paise. */
  subtotal: number;
  itemCount: number;
  charges: { label: string; amount: number }[];
  /** Paise. */
  total: number;
  children?: ReactNode;
}

// Used by the cart, review, confirmation and tracking pages so every page shows the same figures.
// No delivery fee, tax or discount rule is configured in this preview, so none is invented.
export function OrderSummary({ subtotal, itemCount, charges, total, children }: OrderSummaryProps) {
  return (
    <section aria-labelledby="summary-title" className="surface-card rounded-3xl p-5">
      <h2 id="summary-title" className="font-heading text-lg font-semibold">Order summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</dt>
          <dd className="font-medium">{formatPrice(subtotal)}</dd>
        </div>
        {charges.map((charge) => (
          <div key={charge.label} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{charge.label}</dt>
            <dd className="font-medium">{formatPrice(charge.amount)}</dd>
          </div>
        ))}
        {charges.length === 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="text-right text-muted-foreground">Not calculated in this preview</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t pt-3 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-heading font-semibold">{formatPrice(total)}</dd>
        </div>
      </dl>
      {children}
    </section>
  );
}
