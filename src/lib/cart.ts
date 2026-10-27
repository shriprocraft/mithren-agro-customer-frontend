import { effectivePrice } from "@/lib/formatters";
import { lineKey, resolveSelection, type Selection } from "@/lib/variants";
import type { Product } from "@/types/catalog";
import type { CartItem } from "@/types/cart";

/** Placeholder until per-seller stock rules are confirmed (see docs/REQUIREMENTS_REGISTER.md). */
export const MAX_QUANTITY_PER_ITEM = 20;

export type AddResult = "added" | "limit_reached";

/** Keeps a requested quantity within 1…MAX_QUANTITY_PER_ITEM (whole numbers only). */
export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_QUANTITY_PER_ITEM, Math.max(1, Math.floor(quantity)));
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
): { items: CartItem[]; result: AddResult } {
  const key = lineKey(productId, variantId);
  const isLegacyDefault = (item: CartItem) =>
    variantId !== undefined && variantId === defaultVariantId && item.product_id === productId && item.variant_id === undefined;
  const matches = (item: CartItem) => itemKey(item) === key || isLegacyDefault(item);
  const existing = items.find(matches);
  if (!existing) {
    const item: CartItem = { product_id: productId, ...(variantId && { variant_id: variantId }), quantity: clampQuantity(quantity) };
    return { items: [...items, item], result: "added" };
  }
  if (existing.quantity >= MAX_QUANTITY_PER_ITEM) {
    return { items, result: "limit_reached" };
  }
  const next = clampQuantity(existing.quantity + quantity);
  return {
    items: items.map((item) => (item === existing ? { product_id: productId, ...(variantId && { variant_id: variantId }), quantity: next } : item)),
    result: "added",
  };
}

/** `key` is a line key (`lineKey` / `CartLine.key`); for a product without options it is the product id. */
export function setCartQuantity(items: CartItem[], key: string, quantity: number): CartItem[] {
  return items.map((item) => (itemKey(item) === key ? { ...item, quantity: clampQuantity(quantity) } : item));
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

export type LineIssue = "out_of_stock";

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
  if (lines.some((line) => line.quantity < 1 || line.quantity > MAX_QUANTITY_PER_ITEM)) {
    return `Quantities must be between 1 and ${MAX_QUANTITY_PER_ITEM}.`;
  }
  return null;
}
