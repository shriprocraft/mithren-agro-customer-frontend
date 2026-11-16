import { effectivePrice } from "@/lib/formatters";
import { lineKey, resolveSelection, type Selection } from "@/lib/variants";
import type { Product } from "@/types/catalog";
import type { CartItem } from "@/types/cart";

/** The most one cart line can ever hold (the API's limit); sellers may set a lower one. */
export const MAX_QUANTITY_PER_ITEM = 20;

export type AddResult = "added" | "limit_reached";

/** Keeps a requested quantity within min…max (whole numbers only); by default 1…MAX_QUANTITY_PER_ITEM. */
export function clampQuantity(quantity: number, max = MAX_QUANTITY_PER_ITEM, min = 1): number {
  const top = Math.max(1, Math.min(MAX_QUANTITY_PER_ITEM, max));
  const bottom = Math.min(Math.max(1, min), top);
  if (!Number.isFinite(quantity)) return bottom;
  return Math.min(top, Math.max(bottom, Math.floor(quantity)));
}

export interface QuantityLimits {
  min: number;
  /** 0 when nothing can be bought. */
  max: number;
  /** True when stock (not the seller's or the cart's limit) sets the maximum. */
  byStock: boolean;
}

/** How many of this product option one cart line may hold: stock available and the seller's limits. */
export function quantityLimits(product: Pick<Product, "min_quantity" | "max_quantity">, selection: { available_stock?: number }): QuantityLimits {
  const rule = Math.min(MAX_QUANTITY_PER_ITEM, product.max_quantity ?? MAX_QUANTITY_PER_ITEM);
  const stock = selection.available_stock ?? Number.POSITIVE_INFINITY;
  return { min: Math.max(1, product.min_quantity ?? 1), max: Math.max(0, Math.min(rule, stock)), byStock: stock < rule };
}

/** "Only 4 available" when stock is the limit, otherwise the seller's or the cart's per-order limit. */
export function limitMessage(limits: QuantityLimits): string {
  return limits.byStock ? `Only ${limits.max} available` : `Up to ${limits.max} per order`;
}

/** The cart line an item belongs to (product + option). */
export const itemKey = (item: CartItem) => lineKey(item.product_id, item.variant_id);

/**
 * Adding a product option that is already in the cart increases its quantity instead of creating a
 * duplicate line; a different option of the same product is its own line. A line saved before the
 * product had options (no variant_id) stands for its default option, so adding the default option
 * (`defaultVariantId`) joins that line and records the option on it. Quantities are capped at the
 * per-item limit; "limit_reached" means nothing could be added.
 */
export function addToCart(
  items: CartItem[],
  productId: string,
  quantity = 1,
  variantId?: string,
  defaultVariantId?: string,
  max = MAX_QUANTITY_PER_ITEM,
): { items: CartItem[]; result: AddResult } {
  const key = lineKey(productId, variantId);
  const isLegacyDefault = (item: CartItem) =>
    variantId !== undefined && variantId === defaultVariantId && item.product_id === productId && item.variant_id === undefined;
  const matches = (item: CartItem) => itemKey(item) === key || isLegacyDefault(item);
  const existing = items.find(matches);
  if (max < 1) return { items, result: "limit_reached" };
  if (!existing) {
    const item: CartItem = { product_id: productId, ...(variantId && { variant_id: variantId }), quantity: clampQuantity(quantity, max) };
    return { items: [...items, item], result: "added" };
  }
  if (existing.quantity >= Math.min(max, MAX_QUANTITY_PER_ITEM)) {
    return { items, result: "limit_reached" };
  }
  const next = clampQuantity(existing.quantity + quantity, max);
  return {
    items: items.map((item) => (item === existing ? { product_id: productId, ...(variantId && { variant_id: variantId }), quantity: next } : item)),
    result: "added",
  };
}

/** `key` is a line key (`lineKey` / `CartLine.key`); for a product without options it is the product id. */
export function setCartQuantity(items: CartItem[], key: string, quantity: number, max = MAX_QUANTITY_PER_ITEM): CartItem[] {
  return items.map((item) => (itemKey(item) === key ? { ...item, quantity: clampQuantity(quantity, max) } : item));
}

export function removeFromCart(items: CartItem[], key: string): CartItem[] {
  return items.filter((item) => itemKey(item) !== key);
}

export function countItems(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

/** Validates stored cart data (it comes from browser storage and is untrusted). */
export function parseCart(value: unknown): CartItem[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.filter(
    (item): item is CartItem =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as CartItem).product_id === "string" &&
      Number.isInteger((item as CartItem).quantity) &&
      (item as CartItem).quantity > 0,
  );
  return items.map((item) => ({
    product_id: item.product_id,
    ...(typeof item.variant_id === "string" && { variant_id: item.variant_id }),
    quantity: clampQuantity(item.quantity),
  }));
}

/** "insufficient_stock" comes only from the server quote: the sample catalogue has no stock numbers. */
export type LineIssue = "out_of_stock" | "insufficient_stock" | "above_max_quantity" | "below_min_quantity";

export interface CartLine {
  /** Identifies the line as stored (product + option); use it to change or remove the line. */
  key: string;
  product: Product;
  /** The chosen option, its pack size and price. */
  selection: Selection;
  quantity: number;
  /** Paise. */
  unit_price: number;
  /** Paise. */
  line_total: number;
  issue?: LineIssue;
}

/**
 * Joins cart items with the catalogue. Items whose product or option no longer exists are dropped
 * (and reported in `missing`), so a stale cart can never reach checkout with unknown products.
 * Price and availability come from the chosen option.
 */
export function resolveLines(items: CartItem[], catalog: Product[]): { lines: CartLine[]; missing: string[] } {
  const lines: CartLine[] = [];
  const missing: string[] = [];
  for (const item of items) {
    const product = catalog.find((p) => p.id === item.product_id);
    const selection = product && resolveSelection(product, item.variant_id);
    if (!product || !selection) {
      missing.push(itemKey(item));
      continue;
    }
    const unit_price = effectivePrice(selection);
    lines.push({
      key: itemKey(item),
      product,
      selection,
      quantity: item.quantity,
      unit_price,
      line_total: unit_price * item.quantity,
      issue: selection.stock_status === "out_of_stock" ? "out_of_stock" : undefined,
    });
  }
  return { lines, missing };
}

/** Configured charges (delivery, taxes). None are configured in this preview, so totals equal subtotals. */
export const CONFIGURED_CHARGES: { label: string; amount: number }[] = [];

export function summarize(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);
  const charges = CONFIGURED_CHARGES;
  const total = subtotal + charges.reduce((sum, charge) => sum + charge.amount, 0);
  return { subtotal, charges, total, count: lines.reduce((n, line) => n + line.quantity, 0) };
}

/** Why checkout cannot continue with these lines, or null when it can. */
export function checkoutBlocker(lines: CartLine[]): string | null {
  if (lines.length === 0) return "Your cart is empty.";
  if (lines.some((line) => line.issue === "out_of_stock")) return "Remove out-of-stock items to continue.";
  if (lines.some((line) => line.issue === "insufficient_stock")) return "There isn't enough stock for some items. Lower their quantity to continue.";
  if (lines.some((line) => line.issue === "above_max_quantity" || line.issue === "below_min_quantity")) {
    return "Some quantities are outside what the seller allows per order. Adjust them to continue.";
  }
  if (lines.some((line) => line.quantity < 1 || line.quantity > MAX_QUANTITY_PER_ITEM)) {
    return `Quantities must be between 1 and ${MAX_QUANTITY_PER_ITEM}.`;
  }
  return null;
}
