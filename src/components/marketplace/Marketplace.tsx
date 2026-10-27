"use client";

import { useOptimistic, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp, LayoutGrid, LoaderCircle, Search, SearchX, X } from "lucide-react";
import { FilterDrawer } from "@/components/marketplace/FilterDrawer";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";
import { formatPrice } from "@/lib/formatters";
import {
  activeFilterCount,
  applyCriteria,
  clearFilters,
  criteriaToSearch,
  facetsFor,
  parseCriteria,
  sortOptions,
  type MarketplaceCriteria,
  type SortOption,
} from "@/lib/marketplace";
import type { Category, CategorySlug, Product } from "@/types/catalog";

interface MarketplaceProps {
  products: Product[];
  categories: Category[];
  vendorNames: Record<string, string>;
}

// Search, filter and sort the whole catalogue. Reads and writes the URL, so the header search,
// category links and the back button all drive the same results.
//
// Loading: the results follow the URL, so they change when the router has committed the new URL.
// While that navigation is pending the controls already show the new choice (useOptimistic) and,
// if it takes longer than a moment, the grid becomes a skeleton of the same shape. Fast updates
// never flash a skeleton, and nothing is delayed on purpose.
export function Marketplace({ products, categories, vendorNames }: MarketplaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setOptimisticSearch] = useOptimistic(params.toString());
  const committed = parseCriteria(new URLSearchParams(params.toString()));
  const criteria = parseCriteria(new URLSearchParams(search));
  const results = applyCriteria(products, committed, { categories, vendorNames });
  const facets = facetsFor(products, vendorNames);
  const filterCount = activeFilterCount(committed);
  const showSkeleton = useDelayedFlag(pending);
  const categoryCounts = categories.map((category) => ({ category, count: products.filter((p) => p.category_id === category.id).length }));

  const update = (next: MarketplaceCriteria) => {
    const query = criteriaToSearch(next);
    startTransition(() => {
      setOptimisticSearch(query.replace(/^\?/, ""));
      router.push(`${pathname}${query}`, { scroll: false });
    });
  };

  return (
    <>
      {/* One toolbar: search across the width, then category, sort and filters. Phones: search on
          its own row, category full width, then Sort and Filter side by side. */}
      <div className="surface-card grid gap-2.5 rounded-3xl p-2.5 sm:p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-3">
        <SearchBox key={criteria.query} initial={criteria.query} onSearch={(query) => update({ ...criteria, query })} />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:flex-nowrap">
          <CategorySelect criteria={criteria} categories={categoryCounts} total={products.length} onChange={update} />
          <Select value={criteria.sort} onValueChange={(sort) => update({ ...criteria, sort: sort as SortOption })}>
            <SelectTrigger aria-label="Sort products" className="sm:w-64">
              <ArrowDownUp className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="shrink-0 text-muted-foreground max-sm:sr-only">Sort:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {sortOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <FilterDrawer criteria={criteria} facets={facets} categories={categoryCounts} onApply={update} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p aria-live="polite" className="min-w-0 text-sm break-words text-muted-foreground">
          {pending ? (
            <span className="inline-flex items-center gap-2"><LoaderCircle className="size-4 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />Updating results…</span>
          ) : (
            <>
              Showing <span className="font-semibold text-foreground">{results.length}</span> of {products.length} products
              {committed.query ? <> for “<span className="font-medium text-foreground">{committed.query}</span>”</> : null}
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">Priced per pack or unit · seller named on every listing</p>
      </div>

      <ActiveChips criteria={criteria} categories={categories} vendorNames={vendorNames} onChange={update} />

      {showSkeleton ? (
        <ProductGridSkeleton className="mt-4 sm:mt-5" count={Math.min(10, Math.max(4, results.length))} label="Updating products" />
      ) : results.length === 0 ? (
        <div className="surface-card mt-6 flex flex-col items-center gap-3 rounded-3xl px-6 py-12 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="font-heading text-lg font-medium">{filterCount > 0 ? "No products match these filters" : "No products match your search"}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Try removing a filter or searching for something else, such as “dal” or “compost”.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {filterCount > 0 && <Button onClick={() => update(clearFilters(criteria))}>Clear filters</Button>}
            {criteria.query && <Button variant="outline" onClick={() => update({ ...criteria, query: "" })}>Clear search</Button>}
          </div>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
          {results.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                vendorName={vendorNames[product.vendor_id] ?? "Independent seller"}
                imageShape={product.category_id === "cat-womens-apparel" ? "portrait" : "square"}
                sizes="(min-width: 1280px) 230px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function SearchBox({ initial, onSearch }: { initial: string; onSearch: (query: string) => void }) {
  const [value, setValue] = useState(initial);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSearch(value.trim());
  };
  return (
    <form role="search" onSubmit={submit} className="flex min-w-0 gap-2">
      <label htmlFor="marketplace-search" className="sr-only">Search the marketplace</label>
      <div className="relative min-w-0 flex-1">
        {/* type="text": the native search clear button differs per browser, so there is one of our own. */}
        <Input id="marketplace-search" type="text" enterKeyHint="search" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search products, sellers or categories" className="pr-11" />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              if (initial) onSearch("");
            }}
            className="absolute top-1/2 right-0.5 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <Button type="submit" className="px-4 sm:px-5"><Search aria-hidden="true" /><span className="max-[359px]:sr-only">Search</span></Button>
    </form>
  );
}

// Quick single-category switch. Choosing several categories stays in the Filter drawer; when more
// than one is active this shows how many, and picking one here narrows to that category.
function CategorySelect({ criteria, categories, total, onChange }: { criteria: MarketplaceCriteria; categories: { category: Category; count: number }[]; total: number; onChange: (c: MarketplaceCriteria) => void }) {
  const selected = criteria.categories;
  const value = selected.length === 0 ? "all" : selected.length === 1 ? selected[0] : "several";
  return (
    <Select value={value} onValueChange={(slug) => onChange({ ...criteria, categories: slug === "all" ? [] : [slug as CategorySlug] })}>
      <SelectTrigger aria-label="Category" className="col-span-2 sm:w-56">
        <LayoutGrid className="size-4 text-muted-foreground" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value="all" hint={total}>All products</SelectItem>
        <SelectSeparator />
        {categories.map(({ category, count }) => (
          <SelectItem key={category.slug} value={category.slug} hint={count}>{category.name}</SelectItem>
        ))}
        {value === "several" && <SelectItem value="several" disabled>{selected.length} categories (set in Filter)</SelectItem>}
      </SelectContent>
    </Select>
  );
}

function ActiveChips({ criteria, categories, vendorNames, onChange }: { criteria: MarketplaceCriteria; categories: Category[]; vendorNames: Record<string, string>; onChange: (c: MarketplaceCriteria) => void }) {
  const chips: { label: string; remove: MarketplaceCriteria }[] = [
    ...criteria.categories.map((slug) => ({
      label: categories.find((c) => c.slug === slug)?.name ?? slug,
      remove: { ...criteria, categories: criteria.categories.filter((c) => c !== slug) },
    })),
    ...(criteria.minPrice != null || criteria.maxPrice != null
      ? [{
          label: `${criteria.minPrice != null ? formatPrice(criteria.minPrice * 100) : "Any"} – ${criteria.maxPrice != null ? formatPrice(criteria.maxPrice * 100) : "Any"}`,
          remove: { ...criteria, minPrice: null, maxPrice: null },
        }]
      : []),
    ...criteria.availability.map((a) => ({
      label: a === "in_stock" ? "In stock" : "Out of stock",
      remove: { ...criteria, availability: criteria.availability.filter((x) => x !== a) },
    })),
    ...criteria.sellers.map((id) => ({ label: vendorNames[id] ?? id, remove: { ...criteria, sellers: criteria.sellers.filter((s) => s !== id) } })),
    ...criteria.units.map((u) => ({ label: u, remove: { ...criteria, units: criteria.units.filter((x) => x !== u) } })),
    ...(criteria.seasonal ? [{ label: "Seasonal produce", remove: { ...criteria, seasonal: false } }] : []),
    ...(criteria.onSale ? [{ label: "Reduced price", remove: { ...criteria, onSale: false } }] : []),
  ];
  if (chips.length === 0) return null;

  return (
    <ul aria-label="Active filters" className="mt-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <li key={chip.label}>
          <button
            type="button"
            onClick={() => onChange(chip.remove)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-secondary px-3 text-xs font-medium text-secondary-foreground outline-none hover:border-primary/35 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {chip.label}
            <X className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Remove filter</span>
          </button>
        </li>
      ))}
      <li>
        <Button variant="ghost" onClick={() => onChange(clearFilters(criteria))}>Clear all</Button>
      </li>
    </ul>
  );
}
