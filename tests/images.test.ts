// @vitest-environment node
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { bundles } from "@/data/bundles";
import { categories } from "@/data/categories";
import { investmentDomains } from "@/data/investments";
import { products } from "@/data/products";

const publicFile = (src: string) => join(process.cwd(), "public", src);

// Every catalogue, category and investor-domain image is a real local file with alt text, and none is
// a generic placeholder icon.
describe("images", () => {
  const all = [
    ...[...products, ...bundles].flatMap((p) => p.images.map((image) => ({ owner: p.name, image }))),
    ...categories.map((c) => ({ owner: c.name, image: c.image })),
    ...investmentDomains.map((d) => ({ owner: d.name, image: d.image })),
  ];

  it("gives every product, category and investor domain a photo that exists", () => {
    for (const { owner, image } of all) {
      expect(image, owner).toBeDefined();
      expect(image!.src, owner).toMatch(/^\/images\/.+\.(jpg|png|webp)$/);
      expect(existsSync(publicFile(image!.src)), `${owner}: ${image!.src}`).toBe(true);
      expect(image!.alt.length, owner).toBeGreaterThan(5);
      expect(image!.alt, owner).not.toMatch(/coming soon|placeholder/i);
    }
  });

  it("does not reuse one photo for different products", () => {
    const srcs = products.map((p) => p.images[0]!.src);
    expect(new Set(srcs).size).toBe(srcs.length);
  });
});
