import { bundles, comboBoxes } from "@/data/bundles";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import type { Category, CategorySlug, Product, Vendor } from "@/types/catalog";

// The only layer pages call for catalogue data (guide, Section M). Functions are async so call
// sites stay the same when these read from a real API instead of mock data.

export async function getCategories(): Promise<Category[]> {
  return categories;
}

export async function getVendors(): Promise<Vendor[]> {
  return vendors;
}

export async function getProducts(): Promise<Product[]> {
  return products;
}

export async function getProductsByCategory(slug: CategorySlug): Promise<Product[]> {
  const category = categories.find((c) => c.slug === slug);
  return category ? products.filter((p) => p.category_id === category.id) : [];
}

export async function getSeasonalProducts(): Promise<Product[]> {
  return products.filter((p) => p.is_seasonal);
}

/** Every combo box and offer. */
export async function getBundles(): Promise<Product[]> {
  return bundles;
}

/** The ₹1,000 / ₹5,000 / ₹10,000 budget boxes that lead the homepage "Combo offers" section. */
export async function getComboBoxes(): Promise<Product[]> {
  return comboBoxes;
}

/** Everything that can be bought: individual products and combo boxes. */
export async function getCatalog(): Promise<Product[]> {
  return [...products, ...bundles];
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return [...products, ...bundles].find((p) => p.id === id);
}

/** Other items from the same category, for "You may also like" on product details. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  return [...products, ...bundles].filter((p) => p.category_id === product.category_id && p.id !== product.id).slice(0, limit);
}
