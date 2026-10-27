import { cn } from "@/lib/utils";

const pulse = "animate-pulse bg-muted motion-reduce:animate-none";

/** Placeholder with the same outline as ProductCard (square image, two text lines, price, button). */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="surface-card flex h-full flex-col rounded-2xl p-1.5 sm:p-2">
      <div className={cn("aspect-square rounded-xl", pulse)} />
      <div className="flex flex-1 flex-col px-1.5 pt-2.5 pb-0.5">
        <div className={cn("h-4 w-4/5 rounded-full", pulse)} />
        <div className="mt-2 h-3 w-1/3 rounded-full bg-muted" />
        <div className="mt-1.5 h-3 w-2/3 rounded-full bg-muted" />
        <div className="mt-auto pt-3"><div className="h-5 w-16 rounded-full bg-muted" /></div>
        <div className="mt-2.5 h-11 rounded-full bg-muted" />
      </div>
    </div>
  );
}

/** The marketplace results grid while results update; uses the same columns as the real grid. */
export function ProductGridSkeleton({ count = 10, label = "Loading products", className }: { count?: number; label?: string; className?: string }) {
  return (
    <div role="status" aria-label={label} className={className}>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}><ProductCardSkeleton /></li>
        ))}
      </ul>
    </div>
  );
}
