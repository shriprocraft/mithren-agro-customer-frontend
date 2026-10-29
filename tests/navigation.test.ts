// @vitest-environment node
import { describe, expect, it } from "vitest";
import { categories } from "@/data/categories";
import { shopLinks } from "@/lib/navigation";

describe("shopLinks", () => {
  it("lists exactly the nine categories in the required order", () => {
    expect(shopLinks(categories).map((link) => link.name)).toEqual([
      "Spinach",
      "Vegetables",
      "Fruits",
      "Organic Groceries",
      "Oil",
      "Cosmetics",
      "Fancy Items",
      "Women Apparels",
      "Fertilizers",
    ]);
  });

  it("links every category to its own filtered marketplace listing", () => {
    const hrefs = shopLinks(categories).map((link) => link.href);
    expect(new Set(hrefs).size).toBe(9);
    for (const href of hrefs) expect(href).toMatch(/^\/products\?category=[a-z-]+$/);
  });

  it("still lists a category that the reference order does not mention", () => {
    const extra = { ...categories[0]!, id: "cat-extra", slug: "extra" as never, name: "Extra" };
    expect(shopLinks([...categories, extra]).at(-1)?.name).toBe("Extra");
  });
});
