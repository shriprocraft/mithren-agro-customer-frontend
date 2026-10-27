import type { Product, ProductVariant, StockStatus, VariantType } from "@/types/catalog";

// Product options (weights, packs, sizes). A product without `variants` is sold in one form only, so
// every function here also works for it. Untrusted ids (from browser storage or the URL) resolve to
// null, never to a different option, so a cart can never buy something other than what was chosen.

/** What the buyer is getting, for one product and option. */
export interface Selection {
  /** Undefined for products without options. */
  variant: ProductVariant | undefined;
  /** Pack size as sold: "500 g", "6 pieces", or the product's unit for sizes ("2-piece set"). */
  unit: string;
  /** "Size M" for apparel; undefined otherwise (the unit already names the weight or pack). */
  variantLabel: string | undefined;
  /** Unit and size together, for one-line display: "500 g" or "2-piece set · Size M". */
  description: string;
  /** Paise. */
  price: number;
  discounted_price: number | undefined;
  stock_status: StockStatus;
}

export const variantTypeLabels: Record<VariantType, string> = {
  weight: "Weight",
  pack: "Pack",
  volume: "Volume",
  size: "Size",
};

export function hasVariants(product: Product): product is Product & { variants: ProductVariant[] } {
  return Array.isArray(product.variants) && product.variants.length > 0;
}

/** The option a listing shows and a quick "Add to cart" adds. */
export function defaultVariant(product: Product): ProductVariant | undefined {
  if (!hasVariants(product)) return undefined;
  return product.variants.find((v) => v.id === product.default_variant_id) ?? product.variants[0];
}

/**
 * Resolves a product and option id. With no id, a product with options uses its default option
 * (a cart saved before options existed). An unknown id returns null.
 */
export function resolveSelection(product: Product, variantId?: string): Selection | null {
  if (!hasVariants(product)) {
    if (variantId !== undefined) return null;
    return {
      variant: undefined,
      unit: product.unit,
      variantLabel: undefined,
      description: product.unit,
      price: product.price,
      discounted_price: product.discounted_price,
      stock_status: product.stock_status,
    };
  }
  const variant = variantId === undefined ? defaultVariant(product) : product.variants.find((v) => v.id === variantId);
  if (!variant) return null;
  const isSize = product.variant_type === "size";
  const unit = isSize ? product.unit : (variant.unit ?? variant.label);
  const variantLabel = isSize ? `Size ${variant.label}` : undefined;
  return {
    variant,
    unit,
    variantLabel,
    description: variantLabel ? `${unit} · ${variantLabel}` : unit,
    price: variant.price,
    discounted_price: variant.discounted_price,
    stock_status: variant.stock_status,
  };
}

/** Identifies one cart line: the same product in two sizes is two lines. */
export function lineKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}::${variantId}` : productId;
}

/** How many options a listing can mention ("4 sizes"), or null for single-option products. */
export function optionsSummary(product: Product): string | null {
  if (!hasVariants(product) || product.variants.length < 2) return null;
  const n = product.variants.length;
  const noun = product.variant_type === "size" ? "sizes" : "options";
  return `${n} ${noun}`;
}
