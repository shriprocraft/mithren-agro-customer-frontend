import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StockStatus } from "@/types/catalog";

// Text plus icon, so colour is never the only signal (guide, Section N).
const stockStyles: Record<StockStatus, { label: string; className: string; Icon: typeof CircleCheck }> = {
  in_stock: { label: "In stock", className: "text-success", Icon: CircleCheck },
  low_stock: { label: "Low stock", className: "text-warning", Icon: CircleAlert },
  out_of_stock: { label: "Out of stock", className: "text-destructive", Icon: CircleX },
};

/** `available`, when the catalogue sends it, turns "Low stock" into "Only 3 left in stock". */
export function StockBadge({ status, available, className }: { status: StockStatus; available?: number; className?: string }) {
  const { label: plain, className: tone, Icon } = stockStyles[status];
  const label = status === "low_stock" && available !== undefined && available > 0 ? `Only ${available} left in stock` : plain;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", tone, className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
