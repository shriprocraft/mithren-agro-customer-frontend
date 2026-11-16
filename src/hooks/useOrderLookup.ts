"use client";

import { useEffect, useRef, useState } from "react";
import { useOrders } from "@/context/OrdersContext";
import type { Order } from "@/types/order";

/** How often an open order is fetched again while its page is visible. */
export const ORDER_REFRESH_MS = 30_000;
const FINISHED = new Set<Order["status"]>(["delivered", "cancelled"]);

/**
 * One order by its ID, from the signed-in customer's account: the loaded list first, then (an older
 * order, or a link opened directly) fetched on its own. `undefined` while looking.
 */
export function useOrderLookup(id: string): { order: Order | undefined; loading: boolean } {
  const { getOrder, fetchOrder, hydrated, available } = useOrders();
  const listed = hydrated ? getOrder(id) : undefined;
  const [fetched, setFetched] = useState<{ id: string; order: Order | undefined } | null>(null);
  const needsFetch = available && hydrated && !listed;

  useEffect(() => {
    if (!needsFetch) return;
    let active = true;
    void fetchOrder(id).then((order) => active && setFetched({ id, order }));
    return () => {
      active = false;
    };
  }, [needsFetch, fetchOrder, id]);

  // While the order is still moving: fetch it on opening (the list may be older), every 30 seconds while
  // the page is visible, and when the customer comes back to the tab. fetchOrder updates the list.
  const current = listed ?? (fetched?.id === id ? fetched.order : undefined);
  const live = Boolean(available && current && !FINISHED.has(current.status));
  const refresh = useRef(fetchOrder);
  useEffect(() => {
    refresh.current = fetchOrder;
  });
  useEffect(() => {
    if (!live) return;
    const again = () => {
      if (document.visibilityState === "visible") void refresh.current(id);
    };
    again();
    const timer = window.setInterval(again, ORDER_REFRESH_MS);
    document.addEventListener("visibilitychange", again);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", again);
    };
  }, [live, id]);

  if (!hydrated) return { order: undefined, loading: true };
  if (listed) return { order: listed, loading: false };
  if (!needsFetch) return { order: undefined, loading: false };
  return fetched?.id === id ? { order: fetched.order, loading: false } : { order: undefined, loading: true };
}
