import type { Category, CategorySlug, Product } from "@/types/catalog";

// Display rules that depend on a product's category. They match on the category's slug, never its id:
// ids are database ids, while slugs are stable names.

/** Clothing photos are taller than they are wide. */
const PORTRAIT_CATEGORIES: readonly CategorySlug[] = ["womens-apparel"];

export function categorySlugOf(categoryId: string | undefined, categories: Category[]): CategorySlug | undefined {
  return categories.find((category) => category.id === categoryId)?.slug;
}

export function imageShapeFor(product: Pick<Product, "category_id">, categories: Category[]): "portrait" | "square" {
  const slug = categorySlugOf(product.category_id, categories);
  return slug && PORTRAIT_CATEGORIES.includes(slug) ? "portrait" : "square";
}
