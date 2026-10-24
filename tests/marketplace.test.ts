// @vitest-environment node
import { describe, expect, it } from "vitest";
import { bundles } from "@/data/bundles";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { effectivePrice } from "@/lib/formatters";
import {
  activeFilterCount,
  applyCriteria,
  clearFilters,
  criteriaToSearch,
  emptyCriteria,
  facetsFor,
  parseCriteria,
  type MarketplaceCriteria,
} from "@/lib/marketplace";

const catalog = [...products, ...bundles];
const vendorNames = Object.fromEntries(vendors.map((v) => [v.id, v.name]));
const lookups = { categories, vendorNames };
const run = (c: Partial<MarketplaceCriteria>) => applyCriteria(catalog, { ...emptyCriteria, ...c }, lookups);
const categoryId = (slug: string) => categories.find((c) => c.slug === slug)!.id;

describe("marketplace filters", () => {
  it("returns everything with no criteria", () => {
    expect(run({})).toHaveLength(catalog.length);
  });

  it("filters by one or several categories", () => {
    const fruit = run({ categories: ["fruits"] });
    expect(fruit.length).toBeGreaterThan(0);
    expect(fruit.every((p) => p.category_id === categoryId("fruits"))).toBe(true);
    const both = run({ categories: ["fruits", "fertilizers"] });
    expect(both).toHaveLength(fruit.length + run({ categories: ["fertilizers"] }).length);
  });

  it("filters by an inclusive price range in rupees, using the sale price", () => {
    const result = run({ minPrice: 40, maxPrice: 100 });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => effectivePrice(p) >= 4000 && effectivePrice(p) <= 10000)).toBe(true);
    expect(run({ minPrice: 100000 })).toHaveLength(0);
  });

  it("filters by availability, seller, pack size, season and sale", () => {
    expect(run({ availability: ["out_of_stock"] }).every((p) => p.stock_status === "out_of_stock")).toBe(true);
    expect(run({ availability: ["in_stock"] }).some((p) => p.stock_status === "low_stock")).toBe(true);
    expect(run({ sellers: ["v-bhoomi"] }).every((p) => p.vendor_id === "v-bhoomi")).toBe(true);
    expect(run({ units: ["500 g"] }).every((p) => p.unit === "500 g")).toBe(true);
    expect(run({ seasonal: true }).every((p) => p.is_seasonal)).toBe(true);
    expect(run({ onSale: true }).every((p) => p.discounted_price !== undefined && p.discounted_price < p.price)).toBe(true);
  });

  it("combines search with filters (AND across groups)", () => {
    const result = run({ query: "dal", categories: ["organic-groceries"], maxPrice: 150 });
    expect(result.map((p) => p.slug).sort()).toEqual(["chana-dal", "masoor-dal"].filter((slug) => {
      const p = catalog.find((x) => x.slug === slug)!;
      return effectivePrice(p) <= 15000;
    }).sort());
    expect(run({ query: "dal", categories: ["fruits"] })).toHaveLength(0);
  });

  it("sorts by price both ways and by name", () => {
    const asc = run({ sort: "price-asc" }).map(effectivePrice);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = run({ sort: "price-desc" }).map(effectivePrice);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    const names = run({ sort: "name-asc" }).map((p) => p.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe("marketplace URL state", () => {
  it("round-trips criteria through the query string", () => {
    const criteria: MarketplaceCriteria = {
      query: "mango",
      categories: ["fruits", "vegetables"],
      minPrice: 20,
      maxPrice: 500,
      availability: ["in_stock"],
      sellers: ["v-sunrise"],
      units: ["1 kg"],
      seasonal: true,
      onSale: false,
      sort: "price-desc",
    };
    expect(parseCriteria(new URLSearchParams(criteriaToSearch(criteria)))).toEqual(criteria);
    expect(criteriaToSearch(emptyCriteria)).toBe("");
  });

  it("ignores unknown or malformed values and swaps a reversed price range", () => {
    const c = parseCriteria(new URLSearchParams("category=fruits,bogus&min=abc&max=-5&stock=maybe&sort=random"));
    expect(c.categories).toEqual(["fruits"]);
    expect([c.minPrice, c.maxPrice, c.availability, c.sort]).toEqual([null, null, [], "relevance"]);
    const swapped = parseCriteria(new URLSearchParams("min=500&max=20"));
    expect([swapped.minPrice, swapped.maxPrice]).toEqual([20, 500]);
  });

  it("counts active filters and clears them while keeping search and sort", () => {
    const c = { ...emptyCriteria, query: "dal", sort: "name-asc" as const, categories: ["fruits" as const], minPrice: 10, seasonal: true };
    expect(activeFilterCount(c)).toBe(3);
    expect(clearFilters(c)).toEqual({ ...emptyCriteria, query: "dal", sort: "name-asc" });
  });
});

describe("facets", () => {
  it("offers only options present in the data, with counts", () => {
    const facets = facetsFor(catalog, vendorNames);
    expect(facets.sellers.reduce((n, s) => n + s.count, 0)).toBe(catalog.length);
    expect(facets.units.reduce((n, u) => n + u.count, 0)).toBe(catalog.length);
    expect(facets.priceBounds.min).toBeLessThanOrEqual(facets.priceBounds.max);
    expect(facets.hasOutOfStock).toBe(catalog.some((p) => p.stock_status === "out_of_stock"));
  });
});
