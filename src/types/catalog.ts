// Shared catalogue models. Fields are snake_case so they can map to an API response later (guide, Section C).

export interface ImageAsset {
  src: string;
  alt: string;
  /** Isolated product on a white studio backdrop: shown whole (contained) on white, never cropped. */
  studio?: boolean;
}

export const categorySlugs = [
  "spinach",
  "vegetables",
  "fruits",
  "organic-groceries",
  "oil",
  "cosmetics",
  "fancy-items",
  "womens-apparel",
  "fertilizers",
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

/** What a product's options differ by: weight (g/kg), pack (pieces, bunches), volume (ml/L) or apparel size. */
export type VariantType = "weight" | "pack" | "volume" | "size";

/**
 * One purchasable option of a product (e.g. 500 g, 2 kg, size M). Each has its own price and
 * availability; in production these come from the seller portal / catalogue API, not this file.
 */
export interface ProductVariant {
  /** Stable within the product, e.g. "500g", "m". */
  id: string;
  /** Shown on the option chip: "500 g", "M". */
  label: string;
  /** Pack size as sold when it differs from the product's own `unit` (weight, pack and volume options). */
  unit?: string;
  /** Paise. */
  price: number;
  /** Paise. */
  discounted_price?: number;
  stock_status: StockStatus;
}

/** One catalogue item inside a combo box: which product, which option and how many. */
export interface BundleItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
}

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
  /** Present on combo boxes and bundles: what the box holds, as shown to customers. */
  bundle_contents?: string[];
  /**
   * Combo boxes built from catalogue items. The box's price and stock are derived from these
   * (lib/bundles.ts), so the advertised price, the cart line and checkout always agree.
   */
  bundle_items?: BundleItem[];
  /** Short merchandising label on combo cards, e.g. "Family size". Never a discount claim. */
  badge?: string;
  /**
   * Purchasable options. When present, `unit`, `price`, `discounted_price` and `stock_status` above
   * describe the default option (`default_variant_id`), so listings, sorting and filters use it.
   */
  variants?: ProductVariant[];
  variant_type?: VariantType;
  default_variant_id?: string;
}
