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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <FilterDrawer
          criteria={criteria}
          facets={facets}
          categories={categories.map((category) => ({ category, count: products.filter((p) => p.category_id === category.id).length }))}
          onApply={update}
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Sort by
          <select
            value={criteria.sort}
            onChange={(e) => update({ ...criteria, sort: e.target.value as SortOption })}
            className="h-11 rounded-full border border-input bg-background px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <p aria-live="polite" className="ml-auto text-sm font-medium text-muted-foreground">
          Showing {results.length} of {products.length} products
          {criteria.query ? <> for “{criteria.query}”</> : null}
        </p>
      </div>

      <ActiveChips criteria={criteria} categories={categories} vendorNames={vendorNames} onChange={update} />

      {results.length === 0 ? (
        <div className="surface-card mt-6 flex flex-col items-center gap-3 rounded-3xl px-6 py-12 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="font-heading text-lg font-medium">No products match these filters</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Try removing a filter or searching for something else, such as “dal” or “compost”.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {filterCount > 0 && <Button onClick={() => update(clearFilters(criteria))}>Clear filters</Button>}
            {criteria.query && <Button variant="outline" onClick={() => update({ ...criteria, query: "" })}>Clear search</Button>}
          </div>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
      <Input id="marketplace-search" type="search" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search products, sellers or categories" />
      <Button type="submit"><Search aria-hidden="true" />Search</Button>
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
