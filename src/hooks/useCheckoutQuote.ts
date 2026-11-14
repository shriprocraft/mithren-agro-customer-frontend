"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { toQuoteItems } from "@/lib/checkout-quote";
import { checkoutQuotes } from "@/services/checkout";
import type { CartItem } from "@/types/cart";
import type { Quote } from "@/types/checkout";

export type QuoteState =
  | { status: "loading"; quote: Quote | null }
  | { status: "ready"; quote: Quote }
  | { status: "error"; quote: Quote | null; message: string };

const DEBOUNCE_MS = 250;
/** Shown when NEXT_PUBLIC_API_BASE_URL isn't set: prices exist only on the server, so nothing can be priced. */
export const QUOTE_UNAVAILABLE = "The store can't be reached right now, so prices and stock can't be checked. Please try again later.";

export function quoteErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "session_expired") return "Your session has ended. Please sign in again.";
    if (error.code === "address_not_found") return "That address wasn't found. Choose another delivery address.";
    if (error.code === "network_error" || error.code === "timeout") return "We couldn't reach the store to check prices. Check your connection and try again.";
  }
  return "We couldn't check prices right now. Please try again.";
}

/**
 * The server quote for these items (and address), kept up to date as they change. Responses that arrive
 * after a newer request was sent are ignored. `refresh` asks again at once and returns the new quote,
 * for the final check before an order is placed.
 */
export function useCheckoutQuote(items: CartItem[], addressId: string | null, enabled = true) {
  const service = enabled ? checkoutQuotes : null;
  const key = useMemo(() => JSON.stringify({ items: toQuoteItems(items), addressId }), [items, addressId]);
  const [state, setState] = useState<QuoteState>(
    checkoutQuotes ? { status: "loading", quote: null } : { status: "error", quote: null, message: QUOTE_UNAVAILABLE },
  );
  const latest = useRef(0);

  // Reads its inputs from `key`, so it changes exactly when they do.
  const fetchQuote = useCallback(async (): Promise<Quote | null> => {
    if (!service) return null;
    const request = ++latest.current;
    const { items: payload, addressId: address } = JSON.parse(key) as { items: ReturnType<typeof toQuoteItems>; addressId: string | null };
    setState((previous) => ({ status: "loading", quote: "quote" in previous ? previous.quote : null }));
    try {
      const quote = await service.quote(payload, address);
      if (request === latest.current) setState({ status: "ready", quote });
      return quote;
    } catch (error) {
      if (request === latest.current) {
        setState((previous) => ({ status: "error", quote: "quote" in previous ? previous.quote : null, message: quoteErrorMessage(error) }));
      }
      throw error;
    }
  }, [service, key]);

  const empty = items.length === 0;
  useEffect(() => {
    if (!service || empty) return;
    const timer = setTimeout(() => void fetchQuote().catch(() => undefined), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [service, empty, fetchQuote]);

  return { state, refresh: fetchQuote };
}
