import type { Product } from "@/types/catalog";

export interface ProductFilter {
  query: string;
  /** Category id, or null for every category. */
  categoryId: string | null;
}

export interface FilterLookups {
  vendorNames: Record<string, string>;
  categoryNames: Record<string, string>;
}

/** Case-insensitive match on product, seller and category names (guide, Section E). */
export function filterProducts(
  products: Product[],
  { query, categoryId }: ProductFilter,
  { vendorNames, categoryNames }: FilterLookups,
): Product[] {
  const needle = query.trim().toLowerCase();
  return products.filter((product) => {
    if (categoryId && product.category_id !== categoryId) return false;
    if (!needle) return true;
    return [product.name, vendorNames[product.vendor_id], categoryNames[product.category_id]]
      .some((text) => text?.toLowerCase().includes(needle));
  });
}
