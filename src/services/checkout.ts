import { apiBaseUrl, apiEndpoints } from "@/config/api";
import { catalogSource } from "@/config/catalog";
import { createApiClient, type ApiClient } from "@/lib/api-client";
import type { Quote, QuoteItemInput } from "@/types/checkout";

// Server prices for checkout (POST /checkout/quote). Used only with the backend catalogue: sample product
// ids mean nothing to the API, so sample mode keeps pricing in the browser (lib/cart.ts).

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

/** The quote service, or null in sample mode. */
export const checkoutQuotes: CheckoutQuoteService | null =
  catalogSource === "backend" && apiBaseUrl ? createHttpCheckoutQuotes(createApiClient(apiBaseUrl)) : null;
