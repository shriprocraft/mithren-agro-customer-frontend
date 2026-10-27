import type { ReactNode } from "react";
import { FileClock } from "lucide-react";
import { cn } from "@/lib/utils";

// Marks content that is proposed, not confirmed company policy. Used wherever benefits, terms or
// eligibility are described before official documents exist.
export function ProvisionalNotice({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div role="note" className={cn("flex gap-3 rounded-2xl border border-highlight bg-highlight/25 p-4 text-sm", className)}>
      <FileClock className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <div className="mt-0.5 leading-relaxed text-foreground/80">{children}</div>
      </div>
    </div>
  );
}
