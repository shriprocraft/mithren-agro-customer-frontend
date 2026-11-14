import type { OrderStatus } from "@/types/order";

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
