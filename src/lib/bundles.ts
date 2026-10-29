import { effectivePrice } from "@/lib/formatters";
import { resolveSelection, type Selection } from "@/lib/variants";
import type { BundleItem, Product, StockStatus } from "@/types/catalog";

// Combo boxes made of catalogue items. Nothing about a box's price is typed by hand: it is the sum of
// its items at their current catalogue prices (option price × quantity), so the card, the product page,
// the cart line and checkout all show the same amount. A sale price on an item carries through: the
// box's `discounted_price` is the sum of what each item costs today and `price` the sum of their list
// prices, so a struck-through amount appears only when the catalogue itself has a sale. The box is
// still added to the cart as one line (it is a Product), so the cart model is unchanged.

export interface ResolvedBundleItem {
  product: Product;
  selection: Selection;
  quantity: number;
  /** Paise: what this item costs inside the box today (sale price when there is one). */
  line_price: number;
  /** Paise: the same at list price. */
  line_list_price: number;
}

/** Joins a box's items with the catalogue. Throws on an unknown product or option: box data must be valid. */
export function resolveBundleItems(items: BundleItem[], catalog: Product[]): ResolvedBundleItem[] {
  return items.map(({ product_id, variant_id, quantity }) => {
    const product = catalog.find((p) => p.id === product_id);
    const selection = product && resolveSelection(product, variant_id);
    if (!product || !selection) throw new Error(`Combo box item not in the catalogue: ${product_id} ${variant_id ?? ""}`);
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error(`Combo box quantity must be a whole number: ${product_id}`);
    return {
      product,
      selection,
      quantity,
      line_price: effectivePrice(selection) * quantity,
      line_list_price: selection.price * quantity,
    };
  });
}

const stockRank: Record<StockStatus, number> = { in_stock: 0, low_stock: 1, out_of_stock: 2 };

/** A box is only as available as its scarcest item. */
export function bundleStock(items: ResolvedBundleItem[]): StockStatus {
  return items.reduce<StockStatus>(
    (worst, item) => (stockRank[item.selection.stock_status] > stockRank[worst] ? item.selection.stock_status : worst),
    "in_stock",
  );
}

/** "Tomatoes, 2 × 1 kg" or "Papaya, 1 piece (approx. 1 kg)". */
export function describeBundleItem(item: Pick<ResolvedBundleItem, "product" | "selection" | "quantity">): string {
  return `${item.product.name}, ${item.quantity > 1 ? `${item.quantity} × ` : ""}${item.selection.description}`;
}

export type BundleDefinition = Omit<Product, "price" | "discounted_price" | "stock_status" | "unit" | "bundle_contents" | "bundle_items"> & {
  bundle_items: BundleItem[];
};

/** Builds a sellable combo box from its definition, pricing it from the catalogue. */
export function buildBundle(definition: BundleDefinition, catalog: Product[]): Product {
  const items = resolveBundleItems(definition.bundle_items, catalog);
  const price = items.reduce((sum, item) => sum + item.line_list_price, 0);
  const current = items.reduce((sum, item) => sum + item.line_price, 0);
  const packs = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    ...definition,
    unit: `${items.length} items · ${packs} packs`,
    price,
    ...(current < price && { discounted_price: current }),
    stock_status: bundleStock(items),
    bundle_contents: items.map(describeBundleItem),
  };
}
