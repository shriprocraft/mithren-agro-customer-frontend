"use client";

import { useEffect, useState } from "react";
import { useOrders } from "@/context/OrdersContext";
import type { Order } from "@/types/order";

/**
 * One order by its ID. Browser orders come from storage; a backend order not in the loaded list (an
 * older one, or a link opened directly) is fetched from the account. `undefined` while looking.
 */
export function useOrderLookup(id: string): { order: Order | undefined; loading: boolean } {
  const { getOrder, fetchOrder, hydrated, mode } = useOrders();
  const listed = hydrated ? getOrder(id) : undefined;
  const [fetched, setFetched] = useState<{ id: string; order: Order | undefined } | null>(null);
  const needsFetch = mode === "backend" && hydrated && !listed;

  useEffect(() => {
    if (!needsFetch) return;
    let active = true;
    void fetchOrder(id).then((order) => active && setFetched({ id, order }));
    return () => {
      active = false;
    };
  }, [needsFetch, fetchOrder, id]);

  if (!hydrated) return { order: undefined, loading: true };
  if (listed) return { order: listed, loading: false };
  if (!needsFetch) return { order: undefined, loading: false };
  return fetched?.id === id ? { order: fetched.order, loading: false } : { order: undefined, loading: true };
}
