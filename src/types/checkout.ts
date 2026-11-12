import type { ImageAsset, StockStatus } from "@/types/catalog";

// The checkout quote (POST /checkout/quote, docs/BACKEND_CONTRACTS.md): the server's prices and stock
// check for the items being bought. Money is integer paise. Stock is never a number, only an issue.

export interface QuoteItemInput {
  product_id: string;
  variant_id?: string;
  quantity: number;
}

export type QuoteLineIssue = "out_of_stock" | "insufficient_stock";
export type QuoteBlockerCode = "empty" | "unavailable_items" | "out_of_stock" | "insufficient_stock";

export interface QuoteLine {
  /** Position of the item in the request. */
  item_index: number;
  product_id: string;
  /** The option priced: the product's default option when the item named none. */
  variant_id?: string;
  vendor_id: string;
  name: string;
  description: string;
  image?: ImageAsset;
  quantity: number;
  unit_price: number;
  list_unit_price: number;
  line_total: number;
  stock_status: StockStatus;
  issue?: QuoteLineIssue;
}

export interface Quote {
  currency: "INR";
  lines: QuoteLine[];
  unavailable: { item_index: number; product_id: string; variant_id?: string }[];
  item_count: number;
  subtotal: number;
  charges: { label: string; amount: number }[];
  total: number;
  address_id?: string;
  serviceability: "not_checked";
  blockers: { code: QuoteBlockerCode; message: string }[];
  can_checkout: boolean;
  priced_at: string;
}
