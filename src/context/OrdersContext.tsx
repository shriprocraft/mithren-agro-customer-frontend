"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth, useBackendCustomerId } from "@/context/AuthContext";
import { usePersistentState } from "@/hooks/usePersistentState";
import type { CartLine } from "@/lib/cart";
import { canPlaceOrder } from "@/lib/checkout-auth";
import { advanceOrder, buildOrder, generateOrderId, parseOrders } from "@/lib/orders";
import { ordersService as defaultOrdersService, type OrdersService, type PlaceOrderInput } from "@/services/orders";
import type { Address, Order } from "@/types/order";

// Two order stores behind one interface:
// - "backend": a customer signed in through the backend, with the backend catalogue. Orders are Cash on
//   Delivery orders in their account (services/orders.ts); the server checks prices, stock and ownership.
// - "browser": the sample catalogue and the demo account. DEMO ORDER STORE: orders are saved in this
//   browser's localStorage so confirmation and tracking survive a refresh. Not a secure or shared order
//   database: no server, no payment and no seller notification.
export type OrdersMode = "backend" | "browser";

interface OrdersValue {
  mode: OrdersMode;
  orders: Order[];
  hydrated: boolean;
  /** Backend mode: the last list load failed (the list may be incomplete). */
  loadError: string | null;
  getOrder: (id: string) => Order | undefined;
  /** Backend mode: fetches one order not in the list (an older one, or a link from elsewhere). */
  fetchOrder: (id: string) => Promise<Order | undefined>;
  reload: () => Promise<void>;
  /** Browser mode: creates and saves an order. Throws if the customer isn't signed in, or it is invalid or could not be saved. */
  placeOrder: (lines: CartLine[], address: Address) => Order;
  /** Backend mode: places a COD order. Throws ApiError (e.g. `quote_changed`) when the server refuses it. */
  placeServerOrder: (input: PlaceOrderInput, idempotencyKey: string) => Promise<Order>;
  /** Backend mode: cancels an order that hasn't been packed. */
  cancelOrder: (id: string, reason?: string) => Promise<Order>;
  /** Demo-only: moves a browser order to its next tracking stage. */
  advance: (id: string) => void;
  /** Demo account: adds illustrative orders (flagged is_sample). */
  addSamples: (samples: Order[]) => void;
  /** Demo account: removes every sample order. Orders placed through checkout are kept. */
  removeSamples: () => void;
}

const OrdersContext = createContext<OrdersValue | null>(null);
const EMPTY: Order[] = [];

export class OrderSaveError extends Error {}
export class OrderAuthError extends Error {}

function upsert(orders: Order[], order: Order): Order[] {
  const rest = orders.filter((o) => o.id !== order.id);
  return [order, ...rest].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function OrdersProvider({ children, service = defaultOrdersService }: { children: ReactNode; service?: OrdersService | null }) {
  const [orders, setOrders, hydrated] = usePersistentState("mithren.orders", EMPTY, parseOrders);
  const { session } = useAuth();
  const backendCustomerId = useBackendCustomerId();
  const backend = service && backendCustomerId ? service : null;

  // Backend orders, loaded for the signed-in customer and dropped when they change or sign out.
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
  const reload = load;

  useEffect(() => {
    void load();
  }, [load]);

  const serverState = backend && server?.customerId === backendCustomerId ? server : null;

  const value = useMemo<OrdersValue>(() => {
    const browser = {
      placeOrder: (lines: CartLine[], address: Address) => {
        // The last check before an order exists, whichever screen called this.
        if (!canPlaceOrder(session)) throw new OrderAuthError("Please sign in before placing your order.");
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
      advance: (id: string) =>
        setOrders((current) => current.map((order) => (order.id === id ? advanceOrder(order, new Date()) : order))),
      addSamples: (samples: Order[]) =>
        setOrders((current) => [...current, ...samples].sort((a, b) => b.created_at.localeCompare(a.created_at))),
      removeSamples: () => setOrders((current) => current.filter((order) => !order.is_sample)),
    };
    const remember = (order: Order) =>
      setServer((current) =>
        current && current.customerId === backendCustomerId ? { ...current, orders: upsert(current.orders, order) } : current,
      );
    const notBackend = () => Promise.reject(new OrderAuthError("Please sign in before placing your order."));

    if (!backend) {
      return {
        mode: "browser",
        orders,
        hydrated,
        loadError: null,
        getOrder: (id) => orders.find((order) => order.id === id),
        fetchOrder: async (id) => orders.find((order) => order.id === id),
        reload: async () => undefined,
        placeServerOrder: notBackend,
        cancelOrder: notBackend,
        ...browser,
      };
    }
    const list = serverState?.orders ?? EMPTY;
    return {
      mode: "backend",
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
      reload,
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
      ...browser,
      // Status changes come from the store, not this browser.
      advance: () => undefined,
    };
  }, [orders, hydrated, setOrders, session, backend, backendCustomerId, serverState, reload]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const orders = useContext(OrdersContext);
  if (!orders) throw new Error("useOrders must be used inside OrdersProvider");
  return orders;
}
