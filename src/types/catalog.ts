// Shared catalogue models. Fields are snake_case so they can map to an API response later (guide, Section C).

export interface ImageAsset {
  src: string;
  alt: string;
  /** Isolated product on a white studio backdrop: shown whole (contained) on white, never cropped. */
  studio?: boolean;
}

export const categorySlugs = [
  "fruits",
  "vegetables",
  "organic-groceries",
  "fertilizers",
  "womens-apparel",
] as const;

export type CategorySlug = (typeof categorySlugs)[number];

export function isCategorySlug(value: string): value is CategorySlug {
  return (categorySlugs as readonly string[]).includes(value);
}

export interface Category {
  id: string;
  slug: CategorySlug;
  name: string;
  short_description: string;
  image: ImageAsset;
}

export interface Vendor {
  id: string;
  name: string;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category_id: string;
  vendor_id: string;
  images: ImageAsset[];
  /** Pack size or unit as sold, e.g. "1 kg", "1 bunch", "2-piece set". */
  unit: string;
  /** Price in paise. */
  price: number;
  /** Sale price in paise, when the listing has one. */
  discounted_price?: number;
  stock_status: StockStatus;
  is_seasonal?: boolean;
  /** Present on combo boxes and bundles. */
  bundle_contents?: string[];
}

export interface DeliveryArea {
  id: string;
  label: string;
  postal_code: string;
}
