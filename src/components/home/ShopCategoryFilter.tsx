"use client";

import { shopAnchor, type BrowseCategory } from "@/lib/browse";
import { cn } from "@/lib/utils";

interface ShopCategoryFilterProps {
  options: { value: BrowseCategory; label: string; count: number }[];
  value: BrowseCategory;
  onChange: (value: BrowseCategory) => void;
}

// Toggle buttons (aria-pressed). Each button's id is the "#shop-<slug>" anchor that category links target.
export function ShopCategoryFilter({ options, value, onChange }: ShopCategoryFilterProps) {
  return (
    <div role="group" aria-label="Filter by category" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            id={shopAnchor(option.value).slice(1)}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex min-h-11 shrink-0 scroll-mt-32 items-center gap-2 rounded-full px-4 text-[0.8125rem] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring lg:scroll-mt-72",
              selected ? "surface-primary text-primary-foreground hover:bg-primary-hover" : "surface-card text-foreground hover:bg-soft hover:text-primary",
            )}
          >
            {option.label}
            <span className={cn("text-xs", selected ? "text-primary-foreground/85" : "text-muted-foreground")}>
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
