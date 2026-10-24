"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import type { CartLine } from "@/lib/cart";
import { advanceOrder, buildOrder, generateOrderId, parseOrders } from "@/lib/orders";
import type { Address, Order } from "@/types/order";

// DEMO ORDER STORE. Orders are saved in this browser's localStorage so confirmation and tracking
// survive a refresh. This is not a secure or shared order database: there is no server, no payment
// and no seller notification. Replace with API calls when a backend exists.
interface OrdersValue {
  orders: Order[];
  hydrated: boolean;
  getOrder: (id: string) => Order | undefined;
  /** Creates and saves an order. Throws if it is invalid or could not be saved, so no false success. */
  placeOrder: (lines: CartLine[], address: Address) => Order;
  /** Demo-only: moves an order to its next tracking stage. */
  advance: (id: string) => void;
}

const OrdersContext = createContext<OrdersValue | null>(null);
const EMPTY: Order[] = [];

export class OrderSaveError extends Error {}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders, hydrated] = usePersistentState("mithren.orders", EMPTY, parseOrders);

  const value = useMemo<OrdersValue>(
    () => ({
      orders,
      hydrated,
      getOrder: (id) => orders.find((order) => order.id === id),
      placeOrder: (lines, address) => {
        const now = new Date();
        const order = buildOrder(lines, address, generateOrderId(now, new Set(orders.map((o) => o.id))), now);
        const saved = setOrders((current) => [order, ...current]);
        if (!saved) {
          // Undo the in-memory copy so the app never shows an order that was not stored.
          setOrders((current) => current.filter((o) => o.id !== order.id));
          throw new OrderSaveError("Your order could not be saved in this browser. Check that storage is enabled and try again.");
        }
        return order;
      },
      advance: (id) =>
        setOrders((current) => current.map((order) => (order.id === id ? advanceOrder(order, new Date()) : order))),
    }),
    [orders, hydrated, setOrders],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const orders = useContext(OrdersContext);
  if (!orders) throw new Error("useOrders must be used inside OrdersProvider");
  return orders;
}
