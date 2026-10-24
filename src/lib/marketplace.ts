import { effectivePrice } from "@/lib/formatters";
import { isCategorySlug, type Category, type CategorySlug, type Product, type StockStatus } from "@/types/catalog";

// Marketplace search, filters and sorting. The URL query string is the single source of truth, so
// results survive refresh, back/forward and sharing. Every filter here maps to a real product field;
// none is shown unless the data supports it.

export const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
] as const;
export type SortOption = (typeof sortOptions)[number]["value"];

export type Availability = "in_stock" | "out_of_stock";

export interface MarketplaceCriteria {
  query: string;
  categories: CategorySlug[];
  /** Whole rupees, inclusive; null = no bound. */
  minPrice: number | null;
  maxPrice: number | null;
  availability: Availability[];
  sellers: string[];
  units: string[];
  seasonal: boolean;
  onSale: boolean;
  sort: SortOption;
}

export const emptyCriteria: MarketplaceCriteria = {
  query: "",
  categories: [],
  minPrice: null,
  maxPrice: null,
  availability: [],
  sellers: [],
  units: [],
  seasonal: false,
  onSale: false,
  sort: "relevance",
};

const list = (value: string | null) => (value ? value.split(",").map((v) => v.trim()).filter(Boolean) : []);
const rupees = (value: string | null) => {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

/** Reads criteria from URL search params, ignoring anything unknown or malformed. */
export function parseCriteria(params: URLSearchParams): MarketplaceCriteria {
  const sort = params.get("sort");
  let minPrice = rupees(params.get("min"));
  let maxPrice = rupees(params.get("max"));
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
  return {
    query: (params.get("q") ?? "").trim(),
    categories: [...new Set(list(params.get("category")).filter(isCategorySlug))],
    minPrice,
    maxPrice,
    availability: list(params.get("stock")).filter((v): v is Availability => v === "in_stock" || v === "out_of_stock"),
    sellers: list(params.get("seller")),
    units: list(params.get("unit")),
    seasonal: params.get("seasonal") === "1",
    onSale: params.get("sale") === "1",
    sort: sortOptions.some((o) => o.value === sort) ? (sort as SortOption) : "relevance",
  };
}

/** The canonical query string for criteria (empty values omitted). */
export function criteriaToSearch(criteria: MarketplaceCriteria): string {
  const params = new URLSearchParams();
  if (criteria.query) params.set("q", criteria.query);
  if (criteria.categories.length) params.set("category", criteria.categories.join(","));
  if (criteria.minPrice != null) params.set("min", String(criteria.minPrice));
  if (criteria.maxPrice != null) params.set("max", String(criteria.maxPrice));
  if (criteria.availability.length) params.set("stock", criteria.availability.join(","));
  if (criteria.sellers.length) params.set("seller", criteria.sellers.join(","));
  if (criteria.units.length) params.set("unit", criteria.units.join(","));
  if (criteria.seasonal) params.set("seasonal", "1");
  if (criteria.onSale) params.set("sale", "1");
  if (criteria.sort !== "relevance") params.set("sort", criteria.sort);
  const search = params.toString();
  return search ? `?${search}` : "";
}

/** Number of active filter values (search and sort are not filters). */
export function activeFilterCount(c: MarketplaceCriteria): number {
  return (
    c.categories.length +
    (c.minPrice != null || c.maxPrice != null ? 1 : 0) +
    c.availability.length +
    c.sellers.length +
    c.units.length +
    (c.seasonal ? 1 : 0) +
    (c.onSale ? 1 : 0)
  );
}

/** Keeps the search and sort, drops every filter. */
export function clearFilters(c: MarketplaceCriteria): MarketplaceCriteria {
  return { ...emptyCriteria, query: c.query, sort: c.sort };
}

export interface Lookups {
  categories: Category[];
  vendorNames: Record<string, string>;
}

const availabilityOf = (status: StockStatus): Availability => (status === "out_of_stock" ? "out_of_stock" : "in_stock");

/** Applies search, every filter (AND across groups, OR within a group) and the sort. */
export function applyCriteria(products: Product[], c: MarketplaceCriteria, { categories, vendorNames }: Lookups): Product[] {
  const categoryIds = new Set(categories.filter((cat) => c.categories.includes(cat.slug)).map((cat) => cat.id));
  const categoryNames = Object.fromEntries(categories.map((cat) => [cat.id, cat.name]));
  const needle = c.query.toLowerCase();
  const filtered = products.filter((p) => {
    const price = effectivePrice(p);
    if (needle && ![p.name, vendorNames[p.vendor_id], categoryNames[p.category_id]].some((t) => t?.toLowerCase().includes(needle))) return false;
    if (categoryIds.size && !categoryIds.has(p.category_id)) return false;
    if (c.minPrice != null && price < c.minPrice * 100) return false;
    if (c.maxPrice != null && price > c.maxPrice * 100) return false;
    if (c.availability.length && !c.availability.includes(availabilityOf(p.stock_status))) return false;
    if (c.sellers.length && !c.sellers.includes(p.vendor_id)) return false;
    if (c.units.length && !c.units.includes(p.unit)) return false;
    if (c.seasonal && !p.is_seasonal) return false;
    if (c.onSale && !(p.discounted_price !== undefined && p.discounted_price < p.price)) return false;
    return true;
  });
  const sorted = [...filtered];
  if (c.sort === "price-asc") sorted.sort((a, b) => effectivePrice(a) - effectivePrice(b) || a.name.localeCompare(b.name));
  if (c.sort === "price-desc") sorted.sort((a, b) => effectivePrice(b) - effectivePrice(a) || a.name.localeCompare(b.name));
  if (c.sort === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}

export interface Facets {
  /** Whole rupees across the catalogue, for the price inputs and sliders. */
  priceBounds: { min: number; max: number };
  sellers: { id: string; name: string; count: number }[];
  units: { value: string; count: number }[];
  hasOutOfStock: boolean;
  hasSeasonal: boolean;
  hasOnSale: boolean;
}

/** Which filter options the data actually supports, with how many products each covers. */
export function facetsFor(products: Product[], vendorNames: Record<string, string>): Facets {
  const prices = products.map(effectivePrice);
  const count = <K extends string>(keys: K[]) =>
    keys.reduce<Record<string, number>>((acc, key) => ({ ...acc, [key]: (acc[key] ?? 0) + 1 }), {});
  const sellerCounts = count(products.map((p) => p.vendor_id));
  const unitCounts = count(products.map((p) => p.unit));
  return {
    priceBounds: { min: Math.floor(Math.min(...prices) / 100), max: Math.ceil(Math.max(...prices) / 100) },
    sellers: Object.entries(sellerCounts)
      .map(([id, n]) => ({ id, name: vendorNames[id] ?? id, count: n }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    units: Object.entries(unitCounts)
      .map(([value, n]) => ({ value, count: n }))
      .sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true })),
    hasOutOfStock: products.some((p) => p.stock_status === "out_of_stock"),
    hasSeasonal: products.some((p) => p.is_seasonal),
    hasOnSale: products.some((p) => p.discounted_price !== undefined && p.discounted_price < p.price),
  };
}
