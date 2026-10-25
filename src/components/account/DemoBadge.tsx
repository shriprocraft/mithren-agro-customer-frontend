import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small, unobtrusive marker for screens that belong to the demo account (never a security badge). */
export function DemoBadge({ className, label = "Demo mode" }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground", className)}>
      <FlaskConical className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
