import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  /** Omit for the current page. */
  href?: string;
}

/** Breadcrumb trail: a labelled nav with an ordered list; the last item is the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
            {item.href ? (
              <Link href={item.href} className="inline-flex min-h-9 items-center rounded-md underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
