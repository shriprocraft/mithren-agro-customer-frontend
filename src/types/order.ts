// Checkout, address and order models. snake_case so they can map to an API response later.

export const addressTypes = ["home", "work", "other"] as const;
export type AddressType = (typeof addressTypes)[number];

/** Only what delivery needs (scope: do not collect unnecessary personal data). */
export interface Address {
  id: string;
  full_name: string;
  /** 10-digit Indian mobile number, stored without +91 or a leading 0. */
  mobile: string;
  house: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  /** Absent or null when not given (the account API returns null). */
  landmark?: string | null;
  type: AddressType;
  /** From the customer's device, saved only if they confirm an address started from "Use my current location". */
  latitude?: number | null;
  longitude?: number | null;
}

export type AddressInput = Omit<Address, "id">;

/** What is being bought: the whole cart, or one product via "Buy now" (the cart is left untouched). */
export type CheckoutSource = { kind: "cart" } | { kind: "buy_now"; product_id: string; variant_id?: string; quantity: number };

export interface CheckoutSession {
  source: CheckoutSource;
  address_id: string | null;
}

export const orderStatuses = [
  "order_placed",
  "order_confirmed",
  "preparing",
  "ready_for_dispatch",
  "out_for_delivery",
  "delivered",
] as const;
/** The delivery stages in order, plus "cancelled", which ends an order before it is packed. */
export type OrderStatus = (typeof orderStatuses)[number] | "cancelled";

export interface TrackingEvent {
  status: OrderStatus;
  /** ISO timestamp of when the order reached this status. */
  at: string;
}

/** A snapshot of the line at the time of ordering, so later catalogue changes do not alter the order. */
export interface OrderItem {
  /** A product, or a combo box (backend orders). */
  kind?: "product" | "bundle";
  product_id: string;
  /** The option bought, for products with options. */
  variant_id?: string;
  /** e.g. "Size M"; the weight or pack of weight/pack options is already in `unit`. */
  variant_label?: string;
  /** Category at the time of ordering (decides return eligibility). */
  category_id?: string;
  /** Category slug at the time of ordering, for orders from the backend (whose category ids differ). */
  category_slug?: string;
  name: string;
  /** Pack size as bought, e.g. "500 g" or "2-piece set". */
  unit: string;
  image_src: string;
  image_alt: string;
  image_studio?: boolean;
  /** Paise. */
  unit_price: number;
  quantity: number;
  /** Paise: unit_price × quantity. */
  line_total: number;
  /** Products: where this product's seller has got with it (combo boxes can span sellers, so have none). */
  seller_status?: SellerPartStatus;
}

/** One seller's part of the order as the customer sees it. "rejected": declined before accepting. */
export const sellerPartStatuses = ["awaiting_acceptance", "accepted", "packed", "shipped", "delivered", "rejected", "cancelled"] as const;
export type SellerPartStatus = (typeof sellerPartStatuses)[number];

export interface SellerPartItem {
  product_id?: string;
  variant_id?: string;
  name: string;
  variant_label?: string;
  quantity: number;
  /** Paise: this seller's share of the line (a combo box component carries its share of the box). */
  line_total: number;
  image_src?: string;
}

/** Each seller's part of a split (multi-seller) order, with its own status. */
export interface SellerPart {
  /** The seller's order number, e.g. SO-000123. */
  reference: string;
  vendor_id?: string;
  seller_name: string;
  status: SellerPartStatus;
  /** For a cancelled or rejected part: who did it. */
  cancelled_by?: "customer" | "seller";
  /** The seller's reason, when the seller rejected or cancelled it. */
  cancel_reason?: string;
  /** ISO timestamp of the part's last change. */
  updated_at: string;
  /** Paise. */
  amount: number;
  items: SellerPartItem[];
}

/** For multi-seller orders whose sellers don't all agree (absent when they do). */
export type SplitStatus = "partially_accepted" | "partially_cancelled";

/** A configured charge such as delivery. None are configured in this preview. */
export interface OrderCharge {
  label: string;
  /** Paise. */
  amount: number;
}

export interface Order {
  id: string;
  /** ISO timestamp. */
  created_at: string;
  items: OrderItem[];
  address: Address;
  /** Paise. */
  subtotal: number;
  charges: OrderCharge[];
  /** Paise: subtotal + charges. */
  total: number;
  status: OrderStatus;
  /** One event per status reached, oldest first; the last one matches `status`. */
  history: TrackingEvent[];
  /** Orders always come from the backend (Cash on Delivery orders in the customer's account). */
  source?: "backend";
  payment_method?: "cod";
  payment_status?: "pending" | "paid" | "failed" | "refund_pending" | "refunded" | "void";
  /** Whether the customer can still cancel it online: before it is packed, and while no seller has accepted it. */
  cancellable?: boolean;
  /** Why an open order can no longer be cancelled online; absent when it can, or once it has ended. */
  cancel_unavailable?: CancelUnavailableReason;
  cancelled_at?: string;
  /** Who cancelled it: the customer, a seller, or Mithren Agro. */
  cancelled_by?: CancelledBy;
  cancel_reason?: string;
  /** Each seller's part (one per seller). `status` follows the parts still going ahead. */
  seller_parts?: SellerPart[];
  split_status?: SplitStatus;
  /** Paise: what is due on delivery, without parts sellers rejected or cancelled (0 once cancelled). */
  payable_total?: number;
}

export type CancelUnavailableReason = "seller_accepted" | "packed";
export type CancelledBy = "customer" | "seller" | "platform";
