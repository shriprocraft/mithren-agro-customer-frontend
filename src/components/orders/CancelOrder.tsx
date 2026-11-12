"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useOrders } from "@/context/OrdersContext";
import { ApiError } from "@/lib/api-client";
import type { Order } from "@/types/order";

function cancelErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "cannot_cancel") return "This order has been packed, so it can no longer be cancelled online. Please contact support.";
    if (error.code === "session_expired") return "Your session has ended. Please sign in again.";
    if (error.code === "network_error" || error.code === "timeout") return "We couldn't reach the store. Check your connection and try again.";
  }
  return "The order couldn't be cancelled right now. Please try again.";
}

/** Cancels a backend order that hasn't been packed, after the customer confirms. */
export function CancelOrder({ order }: { order: Order }) {
  const { cancelOrder, mode } = useOrders();
  const announce = useAnnounce();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (mode !== "backend" || order.source !== "backend" || !order.cancellable) return null;

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      await cancelOrder(order.id);
      announce("Your order was cancelled.");
      setConfirming(false);
    } catch (e) {
      setError(cancelErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4">
      {confirming ? (
        <div role="group" aria-labelledby={`cancel-${order.id}`} className="rounded-2xl border border-border p-4">
          <p id={`cancel-${order.id}`} className="text-sm font-medium">Cancel this order? This can’t be undone.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="destructive" loading={busy} onClick={() => void cancel()}>Yes, cancel order</Button>
            <Button variant="outline" disabled={busy} onClick={() => setConfirming(false)}>Keep order</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setConfirming(true)}><XCircle aria-hidden="true" />Cancel order</Button>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

/** What kind of order this is, in one line, for the order pages. */
export function orderNotice(order: Order): string {
  if (order.is_sample) return "Sample order for the demo account. It was never placed or paid for, and its tracking is simulated.";
  if (order.source === "backend") {
    if (order.status === "cancelled") return "Cash on Delivery order, cancelled. Nothing is due.";
    return "Cash on Delivery: pay when your order arrives. The status updates as the seller prepares and sends it.";
  }
  return "Demo order: no payment was taken and no seller or delivery partner was notified. Tracking is simulated.";
}
