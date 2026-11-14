"use client";

import { use, type ReactNode } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { LoadingState, MessageState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { useOrderLookup } from "@/hooks/useOrderLookup";
import type { Order } from "@/types/order";

/**
 * Finds an order from the route's orderId in the signed-in customer's account. Shows a loading state
 * while it loads, and a clear not-found state for unknown or malformed order IDs, or when signed out.
 */
export function OrderLookup({ params, children }: { params: Promise<{ orderId: string }>; children: (order: Order) => ReactNode }) {
  const { orderId } = use(params);
  const { order, loading } = useOrderLookup(decodeURIComponent(orderId));
  if (loading) return <LoadingState label="Loading your order…" />;
  if (!order) {
    return (
      <MessageState
        icon={SearchX}
        title="We couldn’t find that order"
        actions={<><Button asChild><Link href="/products">Continue shopping</Link></Button><Button asChild variant="outline"><Link href="/">Go to the homepage</Link></Button></>}
      >
        Check the order ID, and that you’re signed in. Only orders placed from your account can be opened here.
      </MessageState>
    );
  }
  return <>{children(order)}</>;
}
