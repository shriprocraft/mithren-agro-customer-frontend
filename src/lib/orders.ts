import type { OrderStatus, SellerPart, SellerPartStatus } from "@/types/order";

export const orderStatusLabels: Record<OrderStatus, string> = {
  order_placed: "Order Placed",
  order_confirmed: "Order Confirmed",
  preparing: "Preparing Order",
  ready_for_dispatch: "Ready for Dispatch",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const orderStatusDescriptions: Record<OrderStatus, string> = {
  order_placed: "We have received your order.",
  order_confirmed: "The seller has accepted your order.",
  preparing: "Your items are being picked and packed.",
  ready_for_dispatch: "Your order is packed and waiting for pickup.",
  out_for_delivery: "Your order is on its way to you.",
  delivered: "Your order has been delivered.",
  cancelled: "This order was cancelled.",
};

/** Each seller part of a split order, in the customer's words. */
export const sellerPartStatusLabels: Record<SellerPartStatus, string> = {
  awaiting_acceptance: "Waiting for the seller",
  accepted: "Accepted",
  packed: "Packed",
  shipped: "On its way",
  delivered: "Delivered",
  rejected: "Rejected by the seller",
  cancelled: "Cancelled",
};

/** A part that will not be delivered (and is not charged). */
export const isDroppedPart = (status: SellerPartStatus) => status === "rejected" || status === "cancelled";

/** The label for one seller part, saying who cancelled it. */
export function sellerPartLabel(part: Pick<SellerPart, "status" | "cancelled_by">): string {
  if (part.status === "cancelled") return part.cancelled_by === "customer" ? "Cancelled by you" : "Cancelled by the seller";
  return sellerPartStatusLabels[part.status];
}
