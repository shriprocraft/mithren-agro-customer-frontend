import { itemKey, type CartLine } from "@/lib/cart";
import type { CartItem } from "@/types/cart";
import type { Quote, QuoteItemInput } from "@/types/checkout";

// Joins the cart lines the browser shows (names, images, steppers from the catalogue) with the server's
// quote, which is the authority for prices, stock issues, totals and whether checkout may continue.
// Quantities are never changed here: a line the server can't fully supply keeps its quantity and gets
// an issue, and checkout stays blocked until the customer changes it.

export function toQuoteItems(items: CartItem[]): QuoteItemInput[] {
  return items.map(({ product_id, variant_id, quantity }) => ({ product_id, ...(variant_id && { variant_id }), quantity }));
}

export interface QuotedCheckout {
  /** The lines the server priced, with its unit prices, totals and issues. */
  lines: CartLine[];
  summary: { subtotal: number; charges: Quote["charges"]; total: number; count: number };
  /** The first reason checkout can't continue, as the server words it; null when it can. */
  blocker: string | null;
  /** Cart keys of items the server can't sell (no longer listed, or an outdated id). */
  unavailableKeys: string[];
  /** True when a server price differs from the price the page showed from the catalogue. */
  pricesChanged: boolean;
}

/**
 * The cart item a quote entry was asked for, or undefined when the item now at that position is a
 * different one. A quote answers the items as they were when it was asked; while a newer one is on its
 * way (the customer added or removed a line meanwhile), positions can point at other items, and nothing
 * may be priced, flagged or removed by position alone.
 */
export function itemFor(items: CartItem[], entry: { item_index: number; product_id: string; variant_id?: string | null }): CartItem | undefined {
  const item = items[entry.item_index];
  if (!item || item.product_id !== entry.product_id) return undefined;
  // A line saved before the product had options is priced as its default option: only a chosen option must match.
  if (item.variant_id !== undefined && item.variant_id !== (entry.variant_id ?? undefined)) return undefined;
  return item;
}

export function applyQuote(lines: CartLine[], items: CartItem[], quote: Quote): QuotedCheckout {
  const byKey = new Map(lines.map((line) => [line.key, line]));
  const priced: CartLine[] = [];
  let pricesChanged = false;
  for (const quoted of quote.lines) {
    const item = itemFor(items, quoted);
    const local = item && byKey.get(itemKey(item));
    if (!local) continue;
    if (local.unit_price !== quoted.unit_price) pricesChanged = true;
    priced.push({ ...local, unit_price: quoted.unit_price, line_total: quoted.line_total, issue: quoted.issue });
  }
  return {
    lines: priced,
    summary: { subtotal: quote.subtotal, charges: quote.charges, total: quote.total, count: quote.item_count },
    blocker: quote.blockers[0]?.message ?? null,
    unavailableKeys: quote.unavailable.map((entry) => itemFor(items, entry)).filter((item) => item !== undefined).map(itemKey),
    pricesChanged,
  };
}

/** What the customer agreed to when reviewing: items, quantities, prices and the total. */
export function quoteFingerprint(quote: Quote): string {
  return JSON.stringify([
    quote.lines.map((line) => [line.item_index, line.product_id, line.variant_id ?? null, line.quantity, line.unit_price, line.line_total, line.issue ?? null]),
    quote.unavailable.map((item) => item.item_index),
    quote.charges,
    quote.total,
  ]);
}
