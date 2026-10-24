import type { CategorySlug } from "@/types/catalog";

// Category links point at the marketplace (/products), which reads its filters from the URL, so they
// work as plain links from any page and from server components.
export type BrowseCategory = CategorySlug | "all";

export function shopHref(category: BrowseCategory = "all"): string {
  return category === "all" ? "/products" : `/products?category=${category}`;
}
