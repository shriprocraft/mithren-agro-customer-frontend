import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Loading placeholder while saved browser data is read (avoids flashing an empty cart). As a route's
 * Suspense fallback pass `fullHeight`: a placeholder shorter than the screen lets Next.js keep the
 * previous page's scroll position, so the page would open at its bottom (see ProductDetailSkeleton).
 */
export function LoadingState({ label, fullHeight = false }: { label: string; fullHeight?: boolean }) {
  return (
    <div role="status" className={cn("surface-card flex justify-center gap-3 rounded-3xl px-6 py-16 text-sm text-muted-foreground", fullHeight ? "min-h-svh items-start" : "items-center")}>
      <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-border border-t-primary motion-reduce:animate-none" />
      {label}
    </div>
  );
}

/** Empty, not-found and error states: icon, heading, explanation and recovery actions. */
export function MessageState({ icon: Icon, title, children, actions }: { icon: LucideIcon; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="surface-card flex flex-col items-center rounded-3xl px-6 py-14 text-center">
      <Icon className="size-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-4 font-heading text-xl font-semibold">{title}</h2>
      {children && <div className="mt-2 max-w-md text-sm text-muted-foreground">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}
