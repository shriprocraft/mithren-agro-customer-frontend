import { cacheLife } from "next/cache";
import { apiBaseUrl } from "@/config/api";
import { bundles, comboBoxes } from "@/data/bundles";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { createApiClient } from "@/lib/api-client";
import { createHttpCatalog, type CatalogReader } from "@/services/catalog-http";
import type { Category, CategorySlug, Product, Vendor } from "@/types/catalog";

// The only layer pages call for catalogue data (guide, Section M). Two sources:
// - "backend": the customer API (GET /catalog/*), chosen with NEXT_PUBLIC_CATALOG_SOURCE=backend and a
//   valid NEXT_PUBLIC_API_BASE_URL. Results are cached for a few minutes ("use cache"), so pages stay
//   fast and the backend isn't asked on every render.
// - "sample": the mock data in src/data, used otherwise (and by the demo account).

export type CatalogSource = "backend" | "sample";

export function resolveCatalogSource(config: { source: string | undefined; apiBaseUrl: string | null }): CatalogSource {
  return config.source === "backend" && config.apiBaseUrl ? "backend" : "sample";
}

export const catalogSource = resolveCatalogSource({ source: process.env.NEXT_PUBLIC_CATALOG_SOURCE, apiBaseUrl });

function backend(): CatalogReader {
  return createHttpCatalog(createApiClient(apiBaseUrl!));
}

async function fromBackend<T>(read: (catalog: CatalogReader) => Promise<T>): Promise<T> {
  return read(backend());
}

export async function getCategories(): Promise<Category[]> {
  if (catalogSource === "sample") return categories;
  return backendCategories();
}

export async function getVendors(): Promise<Vendor[]> {
  if (catalogSource === "sample") return vendors;
  return backendVendors();
}

export async function getProducts(): Promise<Product[]> {
  if (catalogSource === "sample") return products;
  return backendProducts();
}

export async function getProductsByCategory(slug: CategorySlug): Promise<Product[]> {
  if (catalogSource === "sample") {
    const category = categories.find((c) => c.slug === slug);
    return category ? products.filter((p) => p.category_id === category.id) : [];
  }
  return backendProductsByCategory(slug);
}

export async function getSeasonalProducts(): Promise<Product[]> {
  if (catalogSource === "sample") return products.filter((p) => p.is_seasonal);
  return backendSeasonalProducts();
}

/** Every combo box and offer. */
export async function getBundles(): Promise<Product[]> {
  if (catalogSource === "sample") return bundles;
  return backendBundles();
}

/** The ₹1,000 / ₹5,000 / ₹10,000 budget boxes that lead the homepage "Combo offers" section. */
export async function getComboBoxes(): Promise<Product[]> {
  if (catalogSource === "sample") return comboBoxes;
  return backendComboBoxes();
}

/** Everything that can be bought: individual products and combo boxes. */
export async function getCatalog(): Promise<Product[]> {
  const [items, boxes] = await Promise.all([getProducts(), getBundles()]);
  return [...items, ...boxes];
}

export async function getProduct(id: string): Promise<Product | undefined> {
  if (catalogSource === "sample") return [...products, ...bundles].find((p) => p.id === id);
  return backendProduct(id);
}

/** Other items from the same category, for "You may also like" on product details. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (catalogSource === "sample") {
    return [...products, ...bundles].filter((p) => p.category_id === product.category_id && p.id !== product.id).slice(0, limit);
  }
  return backendRelated(product.id, limit);
}

// Cached backend reads. Each is its own cache entry, keyed by its arguments.

async function backendCategories() {
  "use cache";
  cacheLife("minutes");
  return fromBackend((catalog) => catalog.categories());
}

async function backendVendors() {
  "use cache";
  cacheLife("minutes");
  return fromBackend((catalog) => catalog.vendors());
}

async function backendProducts() {
  "use cache";
  cacheLife("minutes");
  return fromBackend((catalog) => catalog.products());
}

async function backendProductsByCategory(slug: CategorySlug) {
  "use cache";
  cacheLife("minutes");
  return fromBackend((catalog) => catalog.products({ category: slug }));
}

async function backendSeasonalProducts() {
  "use cache";
  cacheLife("minutes");
  return fromBackend((catalog) => catalog.products({ seasonal: true }));
}

async function backendBundles() {
  "use cache";
  cacheLife("minutes");
  return fromBackend((catalog) => catalog.bundles());
}

async function backendComboBoxes() {
  "use cache";
  cacheLife("minutes");
  return fromBackend((catalog) => catalog.bundles({ comboBox: true }));
}

async function backendProduct(id: string) {
  "use cache";
  cacheLife("minutes");
  return fromBackend((catalog) => catalog.product(id));
}

async function backendRelated(id: string, limit: number) {
  "use cache";
  cacheLife("minutes");
  return fromBackend((catalog) => catalog.related(id, limit));
}
