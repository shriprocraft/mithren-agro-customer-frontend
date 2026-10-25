import { describe, expect, it } from "vitest";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { shopHref } from "@/lib/browse";
import { addToCart, countItems, MAX_QUANTITY_PER_ITEM, removeFromCart } from "@/lib/cart";
import { freshPicks, roundRobin } from "@/lib/collections";
import { filterProducts } from "@/lib/filters";
import { effectivePrice, formatPrice } from "@/lib/formatters";

const lookups = {
  vendorNames: Object.fromEntries(vendors.map((v) => [v.id, v.name])),
  categoryNames: Object.fromEntries(categories.map((c) => [c.id, c.name])),
};

describe("formatPrice", () => {
  it("formats paise as rupees, dropping .00", () => {
    expect(formatPrice(4000)).toBe("₹40");
    expect(formatPrice(129900)).toBe("₹1,299");
    expect(formatPrice(4050)).toBe("₹40.50");
  });

  it("uses the sale price when present", () => {
    expect(effectivePrice({ price: 11000, discounted_price: 9500 })).toBe(9500);
    expect(effectivePrice({ price: 11000 })).toBe(11000);
  });
});

describe("filterProducts", () => {
  it("matches product, seller and category names case-insensitively", () => {
    expect(filterProducts(products, { query: "DAL", categoryId: null }, lookups).map((p) => p.slug)).toEqual([
      "masoor-dal",
      "chana-dal",
    ]);
    expect(filterProducts(products, { query: "bhoomi", categoryId: null }, lookups)).toHaveLength(3);
    expect(filterProducts(products, { query: "apparel", categoryId: null }, lookups)).toHaveLength(4);
  });

  it("combines category and query, and returns nothing for no match", () => {
    expect(filterProducts(products, { query: "", categoryId: "cat-fruits" }, lookups)).toHaveLength(4);
    expect(filterProducts(products, { query: "dal", categoryId: "cat-fruits" }, lookups)).toHaveLength(0);
  });
});

describe("cart rules", () => {
  it("merges repeat additions into one line", () => {
    const once = addToCart([], "p-1").items;
    const twice = addToCart(once, "p-1").items;
    expect(twice).toEqual([{ product_id: "p-1", quantity: 2 }]);
    expect(countItems([...twice, { product_id: "p-2", quantity: 3 }])).toBe(5);
  });

  it("stops at the per-item limit", () => {
    const full = [{ product_id: "p-1", quantity: MAX_QUANTITY_PER_ITEM }];
    expect(addToCart(full, "p-1")).toEqual({ items: full, result: "limit_reached" });
  });

  it("removes a line", () => {
    expect(removeFromCart([{ product_id: "p-1", quantity: 2 }], "p-1")).toEqual([]);
  });
});

describe("marketplace links", () => {
  it("opens the marketplace, filtered to a category when given", () => {
    expect(shopHref()).toBe("/products");
    expect(shopHref("all")).toBe("/products");
    expect(shopHref("fertilizers")).toBe("/products?category=fertilizers");
  });
});

describe("collections", () => {
  it("round-robins across groups", () => {
    expect(roundRobin([["a1", "a2"], ["b1"], ["c1", "c2"]])).toEqual(["a1", "b1", "c1", "a2", "c2"]);
    const f = (id: string, is_seasonal?: boolean) => ({ id, is_seasonal });
    expect(freshPicks([f("f1"), f("f2", true), f("f3")], [f("v1", true), f("v2")], 3).map((p) => p.id)).toEqual(["f1", "v2", "f3"]);
  });
});

describe("mock data integrity", () => {
  it("references existing categories and vendors, and uses integer paise", () => {
    const categoryIds = new Set(categories.map((c) => c.id));
    const vendorIds = new Set(vendors.map((v) => v.id));
    for (const product of products) {
      expect(categoryIds.has(product.category_id)).toBe(true);
      expect(vendorIds.has(product.vendor_id)).toBe(true);
      expect(Number.isInteger(product.price)).toBe(true);
      expect(product.images[0]?.alt).toBeTruthy();
    }
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length);
  });

  it("covers all five categories", () => {
    for (const category of categories) {
      expect(products.some((p) => p.category_id === category.id)).toBe(true);
    }
  });
});
