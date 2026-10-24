import { isCategorySlug, type CategorySlug } from "@/types/catalog";

// Category links use "#shop-<slug>" anchors, so they work as plain links from server and client
// components alike, and the homepage product browser picks the category up from the URL hash.
export type BrowseCategory = CategorySlug | "all";

const SHOP_HASH_PREFIX = "shop-";

export function shopAnchor(category: BrowseCategory): string {
  return `#${SHOP_HASH_PREFIX}${category}`;
}

export function categoryFromHash(hash: string): BrowseCategory | null {
  const value = hash.replace(/^#/, "");
  if (!value.startsWith(SHOP_HASH_PREFIX)) return null;
  const slug = value.slice(SHOP_HASH_PREFIX.length);
  return slug === "all" || isCategorySlug(slug) ? slug : null;
}
