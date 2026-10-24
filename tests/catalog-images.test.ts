// @vitest-environment node
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { bundles } from "@/data/bundles";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { shopLinks } from "@/lib/navigation";

const publicDir = fileURLToPath(new URL("../public", import.meta.url));
const catalogueImages = [
  ...products.flatMap((p) => p.images.map((image) => ({ owner: p.slug, image }))),
  ...bundles.flatMap((b) => b.images.map((image) => ({ owner: b.slug, image }))),
  ...categories.map((c) => ({ owner: c.slug, image: c.image })),
  ...shopLinks(categories).map((link) => ({ owner: link.href, image: link.image })),
];

describe("catalogue images", () => {
  it.each(catalogueImages)("$owner → $image.src exists in public/", ({ image }) => {
    expect(existsSync(`${publicDir}${image.src}`)).toBe(true);
  });

  it("every image has alt text", () => {
    for (const { image } of catalogueImages) expect(image.alt.trim().length).toBeGreaterThan(0);
  });

  it("studio images come from the studio folder", () => {
    for (const { image } of catalogueImages.filter(({ image }) => image.studio)) {
      expect(image.src).toMatch(/^\/images\/studio\/(products|bundles|categories|sections)\/.+-studio\.jpg$/);
    }
  });
});
