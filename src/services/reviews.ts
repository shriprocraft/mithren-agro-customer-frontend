import { apiBaseUrl, apiEndpoints } from "@/config/api";
import { createApiClient, type ApiClient } from "@/lib/api-client";

// Product reviews (/products/{id}/reviews, docs/BACKEND_CONTRACTS.md). Anyone can read the published
// reviews; a signed-in customer who ordered the product can write one, and writing again edits it. The
// backend saves each review with the product's seller, so it appears in that seller's portal.

export interface Review {
  id: string;
  product_id: string;
  rating: number;
  title?: string;
  body?: string;
  /** "Asha R." */
  customer_name: string;
  created_at: string;
  updated_at: string;
  verified_purchase: boolean;
  seller_reply?: string;
  seller_replied_at?: string;
}

export interface ReviewList {
  reviews: Review[];
  average_rating?: number;
  review_count: number;
  /** Published reviews per rating, "5" to "1". */
  rating_counts: Record<string, number>;
}

export interface MyReview {
  can_review: boolean;
  review?: Review;
  /** "hidden" once the seller has hidden it. */
  status?: "published" | "hidden";
}

export interface ReviewInput {
  rating: number;
  title?: string;
  body?: string;
}

export interface ReviewsService {
  list(productId: string): Promise<ReviewList>;
  mine(productId: string): Promise<MyReview>;
  submit(productId: string, input: ReviewInput): Promise<MyReview>;
}

export function createHttpReviews(client: ApiClient): ReviewsService {
  const { reviews } = apiEndpoints;
  return {
    list: (productId) => client.request<ReviewList>(reviews.list(productId), { query: { limit: "50" } }),
    mine: (productId) => client.request<MyReview>(reviews.mine(productId)),
    submit: (productId, input) => client.request<MyReview>(reviews.list(productId), { method: "POST", body: input }),
  };
}

/** The reviews service, or null when NEXT_PUBLIC_API_BASE_URL isn't set (no reviews are shown). */
export const reviewsService: ReviewsService | null = apiBaseUrl ? createHttpReviews(createApiClient(apiBaseUrl)) : null;
