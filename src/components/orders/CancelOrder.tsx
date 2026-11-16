"use client";

import { useState } from "react";
import { Lock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useOrders } from "@/context/OrdersContext";
import { ApiError } from "@/lib/api-client";
import type { CancelUnavailableReason, Order } from "@/types/order";

export const cancelUnavailableMessages: Record<CancelUnavailableReason, string> = {
  seller_accepted: "The seller has already accepted this order, so it can no longer be cancelled online. Please contact support if you need help.",
  packed: "This order has been packed, so it can no longer be cancelled online. Please contact support if you need help.",
};

function cancelErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // The store's own wording, e.g. a seller accepted the order a moment before the customer cancelled.
    if (error.code === "cannot_cancel") return error.message || cancelUnavailableMessages.seller_accepted;
    if (error.code === "session_expired") return "Your session has ended. Please sign in again.";
    if (error.code === "network_error" || error.code === "timeout") return "We couldn't reach the store. Check your connection and try again.";
    if ((error.status === 400 || error.status === 409) && error.message) return error.message;
  }
  return "The order couldn't be cancelled right now. Please try again.";
}

/**
 * Cancels an order after the customer confirms, while it can still be cancelled (before it is packed and
 * before any seller accepts it). Otherwise says why it can't be, instead of offering the button.
 */
export function CancelOrder({ order }: { order: Order }) {
  const { cancelOrder, fetchOrder, available } = useOrders();
  const announce = useAnnounce();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!available) return null;

  if (!order.cancellable) {
    const message = error ?? (order.cancel_unavailable && cancelUnavailableMessages[order.cancel_unavailable]);
    if (!message) return null;
    return (
      <p role={error ? "alert" : "status"} className="mt-4 flex gap-2 rounded-2xl border border-border p-3 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </p>
    );
  }

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      await cancelOrder(order.id);
      announce("Your order was cancelled.");
      setConfirming(false);
    } catch (e) {
      setError(cancelErrorMessage(e));
      if (e instanceof ApiError && e.code === "cannot_cancel") {
        // Someone moved the order on meanwhile: show its current status (the button then goes away).
        setConfirming(false);
        void fetchOrder(order.id);
      }
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
  if (order.status === "cancelled") return "Cash on Delivery order, cancelled. Nothing is due.";
  if (order.status === "delivered") return "Cash on Delivery order, delivered.";
  return "Cash on Delivery: pay when your order arrives. The status updates as the seller prepares and sends it.";
}
