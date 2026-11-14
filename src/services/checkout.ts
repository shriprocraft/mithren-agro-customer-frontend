import { apiBaseUrl, apiEndpoints } from "@/config/api";
import { createApiClient, type ApiClient } from "@/lib/api-client";
import type { Quote, QuoteItemInput } from "@/types/checkout";

// Server prices for checkout (POST /checkout/quote): the only source of prices and totals at checkout.

export interface CheckoutQuoteService {
  /** Prices the items. An address id is sent only for an address in the customer's backend account. */
  quote(items: QuoteItemInput[], addressId?: string | null): Promise<Quote>;
}

export function createHttpCheckoutQuotes(client: ApiClient): CheckoutQuoteService {
  return {
    quote: (items, addressId) =>
      client.request<Quote>(apiEndpoints.checkout.quote, {
        method: "POST",
        body: { items, ...(addressId && { address_id: addressId }) },
        timeoutMs: 10_000,
      }),
  };
}

/** The quote service, or null when NEXT_PUBLIC_API_BASE_URL isn't set (checkout then shows an error). */
export const checkoutQuotes: CheckoutQuoteService | null =
  apiBaseUrl ? createHttpCheckoutQuotes(createApiClient(apiBaseUrl)) : null;
