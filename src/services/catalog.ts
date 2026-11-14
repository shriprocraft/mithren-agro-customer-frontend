import { connection } from "next/server";
import { apiBaseUrl } from "@/config/api";
import { createApiClient } from "@/lib/api-client";
import { createHttpCatalog, type CatalogReader } from "@/services/catalog-http";
import type { Category, Product, Vendor } from "@/types/catalog";

// The only layer pages call for catalogue data (guide, Section M). Everything comes from the customer
// API (GET /catalog/*, which reads the database). There is no sample catalogue and no fallback: when the
// API isn't configured or a request fails, the call throws and the page shows its error state
// (app/error.tsx). Nothing is cached: `connection()` makes every read happen at request time, so each
// page load shows the database as it is now.

/** Thrown when NEXT_PUBLIC_API_BASE_URL isn't set to a valid URL, so there is no catalogue to read. */
export class CatalogUnavailableError extends Error {
  constructor() {
    super("The store's catalogue API is not configured (NEXT_PUBLIC_API_BASE_URL).");
    this.name = "CatalogUnavailableError";
  }
}

async function catalog(): Promise<CatalogReader> {
  await connection();
  if (!apiBaseUrl) throw new CatalogUnavailableError();
  return createHttpCatalog(createApiClient(apiBaseUrl));
}

export async function getCategories(): Promise<Category[]> {
  return (await catalog()).categories();
}

export async function getVendors(): Promise<Vendor[]> {
  return (await catalog()).vendors();
}

export async function getProducts(): Promise<Product[]> {
  return (await catalog()).products();
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  return (await catalog()).products({ category: slug });
}

export async function getSeasonalProducts(): Promise<Product[]> {
  return (await catalog()).products({ seasonal: true });
}

/** Every combo box and offer. */
export async function getBundles(): Promise<Product[]> {
  return (await catalog()).bundles();
}

/** The budget boxes that lead the homepage "Combo offers" section. */
export async function getComboBoxes(): Promise<Product[]> {
  return (await catalog()).bundles({ comboBox: true });
}

/** Everything that can be bought: individual products and combo boxes. */
export async function getCatalog(): Promise<Product[]> {
  const [items, boxes] = await Promise.all([getProducts(), getBundles()]);
  return [...items, ...boxes];
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return (await catalog()).product(id);
}

/** Other items from the same category, for "You may also like" on product details. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  return (await catalog()).related(product.id, limit);
}
