import { apiBaseUrl, apiEndpoints } from "@/config/api";
import { createApiClient, type ApiClient } from "@/lib/api-client";
import type { Quote, QuoteItemInput } from "@/types/checkout";
import type { Order, OrderStatus } from "@/types/order";

// Cash on Delivery orders in the customer's account (GET/POST /customer/orders, docs/BACKEND_CONTRACTS.md).
// Needs a signed-in customer: orders exist only in the customer's account on the backend.

export interface PlaceOrderInput {
  items: QuoteItemInput[];
  address_id: string;
  /** From the quote the customer reviewed: any difference refuses the order with `quote_changed`. */
  pricing_version: string;
  expected: { total: number; lines: { item_index: number; unit_price: number }[] };
}

/** The order as the API returns it (paise; `id` is the order number). */
export interface ApiOrder {
  id: string;
  order_number: string;
  created_at: string;
  status: OrderStatus;
  payment_method: "cod";
  payment_status: NonNullable<Order["payment_status"]>;
  items: {
    kind: "product" | "bundle";
    product_id: string;
    variant_id?: string;
    vendor_id: string;
    name: string;
    unit: string;
    category_slug?: string;
    image_src: string;
    image_alt: string;
    image_studio?: boolean;
    unit_price: number;
    list_unit_price: number;
    quantity: number;
    line_total: number;
  }[];
  address: Omit<Order["address"], "id"> & { id?: string };
  subtotal: number;
  charges: { label: string; amount: number }[];
  total: number;
  history: { status: OrderStatus; at: string }[];
  cancellable: boolean;
  cancelled_at?: string;
  cancel_reason?: string;
}

export interface OrdersService {
  list(): Promise<Order[]>;
  get(orderNumber: string): Promise<Order>;
  /** The same idempotency key for a retry of the same order returns that order instead of a new one. */
  place(input: PlaceOrderInput, idempotencyKey: string): Promise<Order>;
  cancel(orderNumber: string, reason?: string): Promise<Order>;
}

export function toOrder(order: ApiOrder): Order {
  return {
    id: order.order_number,
    created_at: order.created_at,
    items: order.items.map((item) => ({
      product_id: item.product_id,
      ...(item.variant_id && { variant_id: item.variant_id }),
      ...(item.category_slug && { category_slug: item.category_slug }),
      name: item.name,
      unit: item.unit,
      image_src: item.image_src,
      image_alt: item.image_alt || item.name,
      ...(item.image_studio && { image_studio: true }),
      unit_price: item.unit_price,
      quantity: item.quantity,
      line_total: item.line_total,
    })),
    // The order keeps its own copy of the address; the saved address may have changed or gone since.
    address: { ...order.address, id: order.address.id ?? "", landmark: order.address.landmark ?? null },
    subtotal: order.subtotal,
    charges: order.charges,
    total: order.total,
    status: order.status,
    history: order.history,
    source: "backend",
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    cancellable: order.cancellable,
    ...(order.cancelled_at && { cancelled_at: order.cancelled_at }),
    ...(order.cancel_reason && { cancel_reason: order.cancel_reason }),
  };
}

/** The fresh quote a `quote_changed` or `checkout_blocked` error carries, if any. */
export function quoteFromError(details: Record<string, unknown> | undefined): Quote | null {
  const quote = details?.quote;
  return quote && typeof quote === "object" ? (quote as Quote) : null;
}

const LIST_LIMIT = "50";

export function createHttpOrders(client: ApiClient): OrdersService {
  return {
    list: async () => {
      const page = await client.request<{ orders: ApiOrder[] }>(apiEndpoints.orders.list, { query: { limit: LIST_LIMIT } });
      return page.orders.map(toOrder);
    },
    get: async (orderNumber) => toOrder(await client.request<ApiOrder>(apiEndpoints.orders.order(orderNumber))),
    place: async (input, idempotencyKey) =>
      toOrder(
        await client.request<ApiOrder>(apiEndpoints.orders.list, {
          method: "POST",
          body: { ...input, payment_method: "cod" },
          headers: { "Idempotency-Key": idempotencyKey },
          timeoutMs: 15_000,
        }),
      ),
    cancel: async (orderNumber, reason) =>
      toOrder(
        await client.request<ApiOrder>(apiEndpoints.orders.cancel(orderNumber), {
          method: "POST",
          body: reason ? { reason } : {},
        }),
      ),
  };
}

/** The orders service, or null when NEXT_PUBLIC_API_BASE_URL isn't set (then no order can be placed). */
export const ordersService: OrdersService | null =
  apiBaseUrl ? createHttpOrders(createApiClient(apiBaseUrl)) : null;

/** Whether a customer signed in through the backend has real orders (My Orders and Track open for them). */
export const ordersLive = ordersService !== null;
