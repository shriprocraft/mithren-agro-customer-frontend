import { bundles } from "@/data/bundles";
import { categories } from "@/data/categories";
import { deliveryAreas } from "@/data/delivery-areas";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import type { Category, CategorySlug, DeliveryArea, Product, Vendor } from "@/types/catalog";

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

export async function getBundles(): Promise<Product[]> {
  return bundles;
}

export async function getDeliveryAreas(): Promise<DeliveryArea[]> {
  return deliveryAreas;
}
