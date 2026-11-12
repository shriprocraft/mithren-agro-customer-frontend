import { apiBaseUrl, apiEndpoints } from "@/config/api";
import { catalogSource } from "@/config/catalog";
import { createApiClient, type ApiClient } from "@/lib/api-client";

// The signed-in customer's wishlist (/customer/wishlist, docs/BACKEND_CONTRACTS.md). Used only with the
// backend catalogue and a backend session: sample product ids mean nothing to the API, so the sample
// catalogue, the demo account and guests keep their wishlist in this browser (WishlistContext).

export interface WishlistService {
  /** Product ids, newest first; only products the storefront still shows. */
  list(): Promise<string[]>;
  add(productId: string): Promise<void>;
  remove(productId: string): Promise<void>;
  /** Adds the ids saved in this browser before signing in (never removes any) and returns the list. */
  merge(productIds: string[]): Promise<string[]>;
}

type ListResponse = { items: { product_id: string; added_at: string }[] };
const ids = (response: ListResponse) => response.items.map((item) => item.product_id);

export function createHttpWishlist(client: ApiClient): WishlistService {
  return {
    list: async () => ids(await client.request<ListResponse>(apiEndpoints.wishlist.list)),
    add: async (productId) => {
      await client.request(apiEndpoints.wishlist.item(productId), { method: "PUT" });
    },
    remove: async (productId) => {
      await client.request(apiEndpoints.wishlist.item(productId), { method: "DELETE" });
    },
    merge: async (productIds) =>
      ids(await client.request<ListResponse>(apiEndpoints.wishlist.merge, { method: "POST", body: { product_ids: productIds } })),
  };
}

/** The wishlist service, or null in sample mode (the wishlist then stays in this browser). */
export const wishlistService: WishlistService | null =
  catalogSource === "backend" && apiBaseUrl ? createHttpWishlist(createApiClient(apiBaseUrl)) : null;

/** Whether a customer signed in through the backend has an account wishlist (My Wishlist opens for them). */
export const wishlistLive = wishlistService !== null;
