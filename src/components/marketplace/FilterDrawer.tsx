"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  activeFilterCount,
  clearFilters,
  type Availability,
  type Facets,
  type MarketplaceCriteria,
} from "@/lib/marketplace";
import type { Category, CategorySlug } from "@/types/catalog";

interface FilterDrawerProps {
  criteria: MarketplaceCriteria;
  facets: Facets;
  categories: { category: Category; count: number }[];
  onApply: (criteria: MarketplaceCriteria) => void;
}

// The dedicated Filter button and its drawer. Choices are drafted inside the drawer and only change
// the results on "Apply filters"; "Clear all" resets the draft. Only filters the data supports appear.
export function FilterDrawer({ criteria, facets, categories, onApply }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(criteria);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <SlidersHorizontal aria-hidden="true" />
          Filter
          {count > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.6875rem] font-semibold text-primary-foreground">
              {count}
              <span className="sr-only"> active {count === 1 ? "filter" : "filters"}</span>
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent aria-describedby="filter-description">
        {/* Radix unmounts the content when closed, so each opening starts a fresh draft from the URL. */}
        <FilterForm
          initial={criteria}
          facets={facets}
          categories={categories}
          onApply={(next) => {
            onApply(next);
            setOpen(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

function FilterForm({ initial, facets, categories, onApply }: Omit<FilterDrawerProps, "criteria" | "onApply"> & { initial: MarketplaceCriteria; onApply: (c: MarketplaceCriteria) => void }) {
  const [draft, setDraft] = useState(initial);
  const { min: floor, max: ceiling } = facets.priceBounds;
  const priceError =
    draft.minPrice != null && draft.maxPrice != null && draft.minPrice > draft.maxPrice
      ? "Minimum price must not be more than the maximum."
      : null;

  const toggle = <K extends "categories" | "availability" | "sellers" | "units">(key: K, value: MarketplaceCriteria[K][number]) =>
    setDraft((d) => {
      const values = d[key] as string[];
      return { ...d, [key]: values.includes(value) ? values.filter((v) => v !== value) : [...values, value] };
    });

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (!priceError) onApply(draft);
      }}
    >
      <div className="border-b px-5 pt-5 pb-4">
        <SheetTitle>Filter products</SheetTitle>
        <SheetDescription id="filter-description">
          {activeFilterCount(draft)} selected · results update when you apply
        </SheetDescription>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <Group legend="Category">
          {categories.map(({ category, count }) => (
            <Check key={category.slug} label={category.name} count={count}
              checked={draft.categories.includes(category.slug)}
              onChange={() => toggle("categories", category.slug as CategorySlug)} />
          ))}
        </Group>

        <fieldset>
          <legend className="text-sm font-semibold">Price (₹)</legend>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <PriceInput label="Minimum" value={draft.minPrice} placeholder={String(floor)} invalid={!!priceError}
              onChange={(v) => setDraft((d) => ({ ...d, minPrice: v }))} />
            <PriceInput label="Maximum" value={draft.maxPrice} placeholder={String(ceiling)} invalid={!!priceError}
              onChange={(v) => setDraft((d) => ({ ...d, maxPrice: v }))} />
          </div>
          <div className="mt-3 space-y-1">
            <Slider label="Minimum price slider" min={floor} max={ceiling} value={draft.minPrice ?? floor}
              onChange={(v) => setDraft((d) => ({ ...d, minPrice: v <= floor ? null : v }))} />
            <Slider label="Maximum price slider" min={floor} max={ceiling} value={draft.maxPrice ?? ceiling}
              onChange={(v) => setDraft((d) => ({ ...d, maxPrice: v >= ceiling ? null : v }))} />
          </div>
          {priceError && <p id="price-error" role="alert" className="mt-2 text-sm text-destructive">{priceError}</p>}
        </fieldset>

        <Group legend="Availability">
          <Check label="In stock" checked={draft.availability.includes("in_stock")} onChange={() => toggle("availability", "in_stock" as Availability)} />
          {facets.hasOutOfStock && (
            <Check label="Out of stock" checked={draft.availability.includes("out_of_stock")} onChange={() => toggle("availability", "out_of_stock" as Availability)} />
          )}
        </Group>

        {(facets.hasSeasonal || facets.hasOnSale) && (
          <Group legend="Offers and season">
            {facets.hasSeasonal && <Check label="Seasonal produce" checked={draft.seasonal} onChange={() => setDraft((d) => ({ ...d, seasonal: !d.seasonal }))} />}
            {facets.hasOnSale && <Check label="Reduced price" checked={draft.onSale} onChange={() => setDraft((d) => ({ ...d, onSale: !d.onSale }))} />}
          </Group>
        )}

        <Group legend="Seller">
          {facets.sellers.map((s) => (
            <Check key={s.id} label={s.name} count={s.count} checked={draft.sellers.includes(s.id)} onChange={() => toggle("sellers", s.id)} />
          ))}
        </Group>

        <Group legend="Pack size">
          {facets.units.map((u) => (
            <Check key={u.value} label={u.value} count={u.count} checked={draft.units.includes(u.value)} onChange={() => toggle("units", u.value)} />
          ))}
        </Group>
      </div>

      <div className="flex gap-3 border-t px-5 py-4">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setDraft(clearFilters(draft))}>
          Clear all
        </Button>
        <Button type="submit" className="flex-1" disabled={!!priceError}>
          Apply filters
        </Button>
      </div>
    </form>
  );
}

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="mt-2 grid gap-0.5">{children}</div>
    </fieldset>
  );
}

function Check({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm hover:bg-soft has-focus-visible:ring-2 has-focus-visible:ring-ring">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-primary outline-none" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-muted-foreground">{count}</span>}
    </label>
  );
}

function PriceInput({ label, value, placeholder, invalid, onChange }: { label: string; value: number | null; placeholder: string; invalid: boolean; onChange: (v: number | null) => void }) {
  return (
    <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value ?? ""}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? "price-error" : undefined}
        onChange={(e) => onChange(e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value))))}
        className="h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
      />
    </label>
  );
}

function Slider({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={5}
      value={Math.min(max, Math.max(min, value))}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-11 w-full cursor-pointer accent-primary"
    />
  );
}
