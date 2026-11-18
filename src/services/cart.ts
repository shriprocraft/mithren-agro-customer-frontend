import { apiBaseUrl, apiEndpoints } from "@/config/api";
import { createApiClient, type ApiClient } from "@/lib/api-client";
import type { CartItem, CartRemoval } from "@/types/cart";

// The signed-in customer's cart (/customer/cart). Guests keep their cart in this browser until they sign
// in, when it is merged into the account (CartContext). Prices are never part of the cart: the checkout
// quote prices it.

/** The account cart after a request, and any lines that request took out (or, on a merge, couldn't add). */
export interface CartSnapshot {
  items: CartItem[];
  removed: CartRemoval[];
}

export interface CartService {
  /** The account's lines, in the order they were added. */
  list(): Promise<CartSnapshot>;
  /** Adds the line or sets its quantity (not an increment), and returns the whole cart. */
  set(item: CartItem): Promise<CartSnapshot>;
  remove(productId: string, variantId?: string): Promise<void>;
  clear(): Promise<void>;
  /** Adds the lines kept in this browser before signing in (never removes any) and returns the cart. */
  merge(items: CartItem[]): Promise<CartSnapshot>;
}

type Line = { product_id: string; variant_id: string | null; quantity: number };
type CartResponse = { items: Line[]; removed?: { product_id: string; variant_id: string | null; reason: CartRemoval["reason"] }[] };

const toSnapshot = (response: CartResponse): CartSnapshot => ({
  items: response.items.map(({ product_id, variant_id, quantity }) => ({ product_id, ...(variant_id && { variant_id }), quantity })),
  // Older API versions don't send `removed`.
  removed: (response.removed ?? []).map(({ product_id, variant_id, reason }) => ({ product_id, ...(variant_id && { variant_id }), reason })),
});

export function createHttpCart(client: ApiClient): CartService {
  const { cart } = apiEndpoints;
  return {
    list: async () => toSnapshot(await client.request<CartResponse>(cart.list)),
    set: async ({ product_id, variant_id, quantity }) =>
      toSnapshot(await client.request<CartResponse>(cart.item(product_id), { method: "PUT", body: { variant_id: variant_id ?? null, quantity } })),
    remove: async (productId, variantId) => {
      await client.request(cart.item(productId), { method: "DELETE", ...(variantId && { query: { variant_id: variantId } }) });
    },
    clear: async () => {
      await client.request(cart.list, { method: "DELETE" });
    },
    merge: async (items) =>
      toSnapshot(
        await client.request<CartResponse>(cart.merge, {
          method: "POST",
          body: { items: items.map(({ product_id, variant_id, quantity }) => ({ product_id, variant_id: variant_id ?? null, quantity })) },
        }),
      ),
  };
}

/** The cart service, or null when NEXT_PUBLIC_API_BASE_URL isn't set (the cart then stays in this browser). */
export const cartService: CartService | null = apiBaseUrl ? createHttpCart(createApiClient(apiBaseUrl)) : null;
