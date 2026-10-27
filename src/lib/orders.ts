import { isValidAddress } from "@/lib/address";
import { checkoutBlocker, summarize, type CartLine } from "@/lib/cart";
import { orderStatuses, type Address, type Order, type OrderStatus } from "@/types/order";

export const orderStatusLabels: Record<OrderStatus, string> = {
  order_placed: "Order Placed",
  order_confirmed: "Order Confirmed",
  preparing: "Preparing Order",
  ready_for_dispatch: "Ready for Dispatch",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

export const orderStatusDescriptions: Record<OrderStatus, string> = {
  order_placed: "We have received your order.",
  order_confirmed: "The seller has accepted your order.",
  preparing: "Your items are being picked and packed.",
  ready_for_dispatch: "Your order is packed and waiting for pickup.",
  out_for_delivery: "Your order is on its way to you.",
  delivered: "Your order has been delivered.",
};

/** The next stage, or null once delivered. Stages only ever move forward, one at a time. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const index = orderStatuses.indexOf(status);
  return index >= 0 && index < orderStatuses.length - 1 ? orderStatuses[index + 1]! : null;
}

const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I, easy to read aloud

/**
 * Order IDs look like MA-20261024-7K3QX9: date plus six random characters from a cryptographic RNG.
 * Retries until the ID is not already taken.
 */
export function generateOrderId(now: Date, taken: Set<string>, random: (n: number) => Uint8Array = defaultRandom): string {
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  for (let attempt = 0; attempt < 50; attempt++) {
    const suffix = Array.from(random(6), (byte) => ID_ALPHABET[byte % ID_ALPHABET.length]).join("");
    const id = `MA-${date}-${suffix}`;
    if (!taken.has(id)) return id;
  }
  throw new Error("Could not generate a unique order ID.");
}

function defaultRandom(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}

export class OrderValidationError extends Error {}

/**
 * Builds a complete, self-consistent order from resolved cart lines and a delivery address.
 * Throws OrderValidationError instead of creating an order that should not exist.
 */
export function buildOrder(lines: CartLine[], address: Address, id: string, now: Date): Order {
  const blocker = checkoutBlocker(lines);
  if (blocker) throw new OrderValidationError(blocker);
  if (!isValidAddress(address)) throw new OrderValidationError("The delivery address is incomplete or invalid.");
  const { subtotal, charges, total } = summarize(lines);
  const created_at = now.toISOString();
  return {
    id,
    created_at,
    items: lines.map(({ product, selection, quantity, unit_price, line_total }) => ({
      product_id: product.id,
      ...(selection.variant && { variant_id: selection.variant.id }),
      ...(selection.variantLabel && { variant_label: selection.variantLabel }),
      category_id: product.category_id,
      name: product.name,
      unit: selection.unit,
      image_src: product.images[0]?.src ?? "",
      image_alt: product.images[0]?.alt ?? product.name,
      image_studio: product.images[0]?.studio,
      unit_price,
      quantity,
      line_total,
    })),
    address,
    subtotal,
    charges: [...charges],
    total,
    status: "order_placed",
    history: [{ status: "order_placed", at: created_at }],
  };
}

/** Moves an order to the next stage, recording when. Returns the order unchanged once delivered. */
export function advanceOrder(order: Order, now: Date): Order {
  const next = nextStatus(order.status);
  if (!next) return order;
  return { ...order, status: next, history: [...order.history, { status: next, at: now.toISOString() }] };
}

const isStatus = (value: unknown): value is OrderStatus => orderStatuses.includes(value as OrderStatus);

/** Validates stored orders (from browser storage, so untrusted). Drops malformed or inconsistent entries. */
export function parseOrders(value: unknown): Order[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((o): o is Order => {
    if (typeof o !== "object" || o === null) return false;
    const order = o as Order;
    if (typeof order.id !== "string" || typeof order.created_at !== "string" || !isStatus(order.status)) return false;
    if (!Array.isArray(order.items) || order.items.length === 0 || !Array.isArray(order.history)) return false;
    if (!order.history.every((event) => isStatus(event?.status) && typeof event.at === "string")) return false;
    if (order.history.at(-1)?.status !== order.status) return false;
    const subtotal = order.items.reduce((sum, item) => sum + item.line_total, 0);
    const charges = Array.isArray(order.charges) ? order.charges.reduce((sum, c) => sum + c.amount, 0) : NaN;
    return subtotal === order.subtotal && subtotal + charges === order.total && isValidAddress(order.address);
  });
}
