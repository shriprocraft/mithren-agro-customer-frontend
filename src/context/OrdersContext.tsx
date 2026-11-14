"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useBackendCustomerId } from "@/context/AuthContext";
import { ordersService as defaultOrdersService, type OrdersService, type PlaceOrderInput } from "@/services/orders";
import type { Order } from "@/types/order";

// The signed-in customer's orders, from their account on the backend (services/orders.ts): Cash on
// Delivery orders whose prices, stock and ownership the server checks. Nothing is stored in the browser
// and there are no sample orders: signed out, or with the API unavailable, the list is empty.
interface OrdersValue {
  /** True when a customer is signed in and the orders API is configured. */
  available: boolean;
  orders: Order[];
  hydrated: boolean;
  /** The last list load failed (the list may be incomplete). */
  loadError: string | null;
  getOrder: (id: string) => Order | undefined;
  /** Fetches one order not in the list (an older one, or a link from elsewhere). */
  fetchOrder: (id: string) => Promise<Order | undefined>;
  reload: () => Promise<void>;
  /** Places a COD order. Throws ApiError (e.g. `quote_changed`) when the server refuses it. */
  placeServerOrder: (input: PlaceOrderInput, idempotencyKey: string) => Promise<Order>;
  /** Cancels an order that hasn't been packed. */
  cancelOrder: (id: string, reason?: string) => Promise<Order>;
}

const OrdersContext = createContext<OrdersValue | null>(null);
const EMPTY: Order[] = [];

export class OrderAuthError extends Error {}

function upsert(orders: Order[], order: Order): Order[] {
  const rest = orders.filter((o) => o.id !== order.id);
  return [order, ...rest].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function OrdersProvider({ children, service = defaultOrdersService }: { children: ReactNode; service?: OrdersService | null }) {
  const backendCustomerId = useBackendCustomerId();
  const backend = service && backendCustomerId ? service : null;

  // Loaded for the signed-in customer and dropped when they change or sign out.
  const [server, setServer] = useState<{ customerId: string; orders: Order[]; loaded: boolean; error: string | null } | null>(null);
  const loadSeq = useRef(0);
  // Loads the list; only the latest load may update it.
  const load = useCallback((): Promise<void> => {
    if (!backend || !backendCustomerId) return Promise.resolve();
    const seq = ++loadSeq.current;
    return backend.list().then(
      (list) => {
        if (seq === loadSeq.current) setServer({ customerId: backendCustomerId, orders: list, loaded: true, error: null });
      },
      () => {
        if (seq !== loadSeq.current) return;
        setServer((current) => ({
          customerId: backendCustomerId,
          orders: current?.customerId === backendCustomerId ? current.orders : [],
          loaded: true,
          error: "We couldn't load your orders. Check your connection and try again.",
        }));
      },
    );
  }, [backend, backendCustomerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const serverState = backend && server?.customerId === backendCustomerId ? server : null;

  const value = useMemo<OrdersValue>(() => {
    const signInFirst = () => Promise.reject(new OrderAuthError("Please sign in before placing your order."));
    if (!backend) {
      return {
        available: false,
        orders: EMPTY,
        hydrated: true,
        loadError: null,
        getOrder: () => undefined,
        fetchOrder: async () => undefined,
        reload: async () => undefined,
        placeServerOrder: signInFirst,
        cancelOrder: signInFirst,
      };
    }
    const remember = (order: Order) =>
      setServer((current) => (current && current.customerId === backendCustomerId ? { ...current, orders: upsert(current.orders, order) } : current));
    const list = serverState?.orders ?? EMPTY;
    return {
      available: true,
      orders: list,
      hydrated: Boolean(serverState?.loaded),
      loadError: serverState?.error ?? null,
      getOrder: (id) => list.find((order) => order.id === id),
      fetchOrder: async (id) => {
        try {
          const order = await backend.get(id);
          remember(order);
          return order;
        } catch {
          return undefined;
        }
      },
      reload: load,
      placeServerOrder: async (input, key) => {
        const order = await backend.place(input, key);
        remember(order);
        return order;
      },
      cancelOrder: async (id, reason) => {
        const order = await backend.cancel(id, reason);
        remember(order);
        return order;
      },
    };
  }, [backend, backendCustomerId, serverState, load]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const orders = useContext(OrdersContext);
  if (!orders) throw new Error("useOrders must be used inside OrdersProvider");
  return orders;
}
