// @vitest-environment node
import { describe, expect, it } from "vitest";
import { bundles, comboBoxes, comboOffers } from "@/data/bundles";
import { products } from "@/data/products";
import { buildBundle, bundleStock, resolveBundleItems } from "@/lib/bundles";
import { addToCart, resolveLines, summarize } from "@/lib/cart";
import { effectivePrice } from "@/lib/formatters";

const catalog = [...products, ...bundles];

describe("combo boxes", () => {
  it("costs exactly ₹1,000, ₹5,000 and ₹10,000 at today's catalogue prices", () => {
    expect(comboBoxes.map((box) => [box.name, effectivePrice(box)])).toEqual([
      ["Essential Fresh Box", 100000],
      ["Family Harvest Box", 500000],
      ["Premium Harvest Box", 1000000],
    ]);
  });

  it("holds fresh produce only: vegetables, leafy greens and fruit", () => {
    const produce = new Set(["cat-vegetables", "cat-fruits", "cat-spinach"]);
    for (const box of comboBoxes) {
      for (const item of box.bundle_items ?? []) {
        expect(produce.has(products.find((p) => p.id === item.product_id)!.category_id), `${box.name}: ${item.product_id}`).toBe(true);
      }
    }
  });

  it("prices every combo as the sum of its items, with no hand-typed price", () => {
    for (const box of bundles) {
      const items = resolveBundleItems(box.bundle_items!, products);
      expect(effectivePrice(box)).toBe(items.reduce((sum, item) => sum + item.line_price, 0));
      expect(box.price).toBe(items.reduce((sum, item) => sum + item.line_list_price, 0));
      expect(Number.isInteger(box.price)).toBe(true);
    }
  });

  it("is built only from catalogue products and lists every item with its quantity", () => {
    for (const box of bundles) {
      expect(box.bundle_contents).toHaveLength(box.bundle_items!.length);
      for (const item of box.bundle_items!) expect(products.some((p) => p.id === item.product_id)).toBe(true);
    }
    expect(comboBoxes[0]!.bundle_contents).toContain("Tomatoes, 2 × 1 kg");
  });

  it("keeps the earlier combo ids, so saved carts still resolve", () => {
    expect(comboOffers.map((o) => o.id)).toEqual(["b-kitchen-vegetable-box", "b-fruit-basket", "b-mixed-harvest-box"]);
  });

  it("puts the whole box in the cart as one line, and the cart total equals the advertised price", () => {
    for (const box of comboBoxes) {
      const { items } = addToCart([], box.id, 1);
      const { lines } = resolveLines(items, catalog);
      expect(lines).toHaveLength(1);
      expect(summarize(lines).total).toBe(effectivePrice(box));
    }
    const two = addToCart(addToCart([], comboBoxes[0]!.id).items, comboBoxes[0]!.id).items;
    expect(summarize(resolveLines(two, catalog).lines).total).toBe(200000);
  });

  it("is only as available as its scarcest item", () => {
    const items = resolveBundleItems([{ product_id: "p-tomatoes", variant_id: "1kg", quantity: 1 }], products);
    expect(bundleStock(items)).toBe("in_stock");
    const withJowar = resolveBundleItems([{ product_id: "p-tomatoes", variant_id: "1kg", quantity: 1 }, { product_id: "p-jowar", quantity: 1 }], products);
    expect(bundleStock(withJowar)).toBe("out_of_stock");
  });

  it("refuses unknown products, options or quantities", () => {
    const base = { id: "x", slug: "x", name: "X", description: "", category_id: "cat-vegetables", vendor_id: "v-harvest-lane", images: [] };
    expect(() => buildBundle({ ...base, bundle_items: [{ product_id: "p-nope", quantity: 1 }] }, products)).toThrow();
    expect(() => buildBundle({ ...base, bundle_items: [{ product_id: "p-tomatoes", variant_id: "3kg", quantity: 1 }] }, products)).toThrow();
    expect(() => buildBundle({ ...base, bundle_items: [{ product_id: "p-tomatoes", variant_id: "1kg", quantity: 0 }] }, products)).toThrow();
  });
});
