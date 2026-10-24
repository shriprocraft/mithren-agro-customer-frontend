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
  landmark?: string;
  type: AddressType;
}

export type AddressInput = Omit<Address, "id">;

/** What is being bought: the whole cart, or one product via "Buy now" (the cart is left untouched). */
export type CheckoutSource = { kind: "cart" } | { kind: "buy_now"; product_id: string; quantity: number };

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
export type OrderStatus = (typeof orderStatuses)[number];

export interface TrackingEvent {
  status: OrderStatus;
  /** ISO timestamp of when the order reached this status. */
  at: string;
}

/** A snapshot of the line at the time of ordering, so later catalogue changes do not alter the order. */
export interface OrderItem {
  product_id: string;
  name: string;
  unit: string;
  image_src: string;
  image_alt: string;
  image_studio?: boolean;
  /** Paise. */
  unit_price: number;
  quantity: number;
  /** Paise: unit_price × quantity. */
  line_total: number;
}

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
}
