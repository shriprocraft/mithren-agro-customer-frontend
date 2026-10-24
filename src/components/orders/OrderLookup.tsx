"use client";

import { use, type ReactNode } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { LoadingState, MessageState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/context/OrdersContext";
import type { Order } from "@/types/order";

/**
 * Finds an order from the route's orderId (orders live in this browser's storage, so the lookup runs on
 * the client). Shows a loading state until storage is read, and a clear not-found state for unknown,
 * malformed or other-browser order IDs.
 */
export function OrderLookup({ params, children }: { params: Promise<{ orderId: string }>; children: (order: Order) => ReactNode }) {
  const { orderId } = use(params);
  const { getOrder, hydrated } = useOrders();
  if (!hydrated) return <LoadingState label="Loading your order…" />;
  const order = getOrder(decodeURIComponent(orderId));
  if (!order) {
    return (
      <MessageState
        icon={SearchX}
        title="We couldn’t find that order"
        actions={<><Button asChild><Link href="/products">Continue shopping</Link></Button><Button asChild variant="outline"><Link href="/">Go to the homepage</Link></Button></>}
      >
        Check the order ID. In this demo, orders are saved in the browser they were placed in, so they can’t be opened from another device or after clearing site data.
      </MessageState>
    );
  }
  return <>{children(order)}</>;
}
