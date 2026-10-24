import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StockStatus } from "@/types/catalog";

// Text plus icon, so colour is never the only signal (guide, Section N).
const stockStyles: Record<StockStatus, { label: string; className: string; Icon: typeof CircleCheck }> = {
  in_stock: { label: "In stock", className: "text-success", Icon: CircleCheck },
  low_stock: { label: "Low stock", className: "text-warning", Icon: CircleAlert },
  out_of_stock: { label: "Out of stock", className: "text-destructive", Icon: CircleX },
};

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  const { label, className: tone, Icon } = stockStyles[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", tone, className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
