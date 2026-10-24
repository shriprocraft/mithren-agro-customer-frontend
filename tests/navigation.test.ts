// @vitest-environment node
import { describe, expect, it } from "vitest";
import { categories } from "@/data/categories";
import { shopLinks } from "@/lib/navigation";

describe("shopLinks", () => {
  it("follows the reference navigation order, including the homepage collections", () => {
    expect(shopLinks(categories).map((link) => link.name)).toEqual([
      "Vegetables",
      "Fruits",
      "Organic Groceries",
      "Seasonal produce",
      "Combo boxes",
      "Fertilizers",
      "Women's Apparel",
    ]);
  });

  it("links categories to the shop browser and collections to their sections", () => {
    const hrefs = shopLinks(categories).map((link) => link.href);
    expect(hrefs).toContain("#shop-vegetables");
    expect(hrefs).toContain("#seasonal");
    expect(hrefs).toContain("#bundles");
  });

  it("still lists a category that the reference order does not mention", () => {
    const extra = { ...categories[0]!, id: "cat-extra", slug: "extra" as never, name: "Extra" };
    expect(shopLinks([...categories, extra]).at(-1)?.name).toBe("Extra");
  });
});
