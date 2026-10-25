"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SearchX, X } from "lucide-react";
import { FilterDrawer } from "@/components/marketplace/FilterDrawer";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Category, Product } from "@/types/catalog";

interface MarketplaceProps {
  products: Product[];
  categories: Category[];
  vendorNames: Record<string, string>;
}

// Search, filter and sort the whole catalogue. Reads and writes the URL, so the header search,
// category links and the back button all drive the same results.
export function Marketplace({ products, categories, vendorNames }: MarketplaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const criteria = parseCriteria(new URLSearchParams(params.toString()));
  const results = applyCriteria(products, criteria, { categories, vendorNames });
  const facets = facetsFor(products, vendorNames);
  const filterCount = activeFilterCount(criteria);

  const update = (next: MarketplaceCriteria) => router.push(`${pathname}${criteriaToSearch(next)}`, { scroll: false });

  return (
    <>
      <SearchBox key={criteria.query} initial={criteria.query} onSearch={(query) => update({ ...criteria, query })} />

      {/* Phones: Filter and Sort share one row as two equal controls, the count sits below them. */}
      <div className="mt-3 grid grid-cols-2 items-center gap-2 sm:mt-4 sm:flex sm:flex-wrap sm:gap-3">
        <FilterDrawer
          criteria={criteria}
          facets={facets}
          categories={categories.map((category) => ({ category, count: products.filter((p) => p.category_id === category.id).length }))}
          onApply={update}
        />
        <label className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <span className="sr-only sm:not-sr-only">Sort by</span>
          <select
            value={criteria.sort}
            onChange={(e) => update({ ...criteria, sort: e.target.value as SortOption })}
            className="h-11 w-full min-w-0 rounded-full border border-input bg-background px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <p aria-live="polite" className="col-span-2 min-w-0 text-sm font-medium break-words text-muted-foreground sm:ml-auto">
          Showing {results.length} of {products.length} products
          {criteria.query ? <> for “<span className="text-foreground">{criteria.query}</span>”</> : null}
        </p>
      </div>

      <ActiveChips criteria={criteria} categories={categories} vendorNames={vendorNames} onChange={update} />

      {results.length === 0 ? (
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
    <form role="search" onSubmit={submit} className="flex max-w-xl gap-2">
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
