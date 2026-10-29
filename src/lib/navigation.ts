import { shopHref } from "@/lib/browse";
import type { Category, ImageAsset } from "@/types/catalog";

// "Shop by category" lists the catalogue's categories in their configured order (data/categories.ts):
// Spinach, Vegetables, Fruits, Organic Groceries, Oil, Cosmetics, Fancy Items, Women Apparels,
// Fertilizers. Each opens the marketplace filtered to that category. The combo sections have their
// own homepage sections and footer links, so they are not tiles here.
export interface ShopLink {
  href: string;
  name: string;
  image: ImageAsset;
  category: Category;
}

export function shopLinks(categories: Category[]): ShopLink[] {
  return categories.map((category) => ({
    href: shopHref(category.slug),
    name: category.name,
    image: category.image,
    category,
  }));
}
