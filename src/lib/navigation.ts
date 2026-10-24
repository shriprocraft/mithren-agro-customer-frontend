import { shopHref } from "@/lib/browse";
import type { Category, CategorySlug, ImageAsset } from "@/types/catalog";

// Order of the reference's navigation row and category tiles: vegetables, fruits, pantry, the two
// homepage collections (seasonal, combo boxes), fertilizers, apparel. The reference also lists
// leafy greens, herbs and exotic vegetables; the catalogue has no such categories, so they are
// left out rather than invented.
type ShopEntry = { kind: "category"; slug: CategorySlug } | { kind: "section"; key: keyof typeof sectionLinks };

const shopOrder: ShopEntry[] = [
  { kind: "category", slug: "vegetables" },
  { kind: "category", slug: "fruits" },
  { kind: "category", slug: "organic-groceries" },
  { kind: "section", key: "seasonal" },
  { kind: "section", key: "bundles" },
  { kind: "category", slug: "fertilizers" },
  { kind: "category", slug: "womens-apparel" },
];

const sectionLinks = {
  seasonal: {
    href: "/#seasonal",
    name: "Seasonal produce",
    image: { src: "/images/studio/sections/seasonal-studio.jpg", alt: "Mangoes, pomegranates and carrots grouped together", studio: true },
  },
  bundles: {
    href: "/#bundles",
    name: "Combo boxes",
    image: { src: "/images/studio/sections/combo-boxes-studio.jpg", alt: "Two wooden crates, one of vegetables and one of fruit", studio: true },
  },
};

export interface ShopLink {
  href: string;
  name: string;
  image: ImageAsset;
  /** Set for catalogue categories; homepage sections have none. */
  category?: Category;
}

const categoryLink = (category: Category): ShopLink => ({
  href: shopHref(category.slug),
  name: category.name,
  image: category.image,
  category,
});

export function shopLinks(categories: Category[]): ShopLink[] {
  const ordered = shopOrder.flatMap((entry): ShopLink[] => {
    if (entry.kind === "section") return [sectionLinks[entry.key]];
    const category = categories.find((c) => c.slug === entry.slug);
    return category ? [categoryLink(category)] : [];
  });
  // A category added to the data later still appears, after the reference order.
  const placed = new Set(shopOrder.flatMap((entry) => (entry.kind === "category" ? [entry.slug] : [])));
  return [...ordered, ...categories.filter((c) => !placed.has(c.slug)).map(categoryLink)];
}
