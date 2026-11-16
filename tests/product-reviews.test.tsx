import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { AppProviders } from "@/context/AppProviders";
import { ApiError, type ApiClient } from "@/lib/api-client";
import { unavailableAuthService } from "@/services/auth/unavailable";
import { createHttpReviews, type MyReview, type ReviewList, type ReviewsService } from "@/services/reviews";
import type { AuthService } from "@/types/auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/products/p1",
  useSearchParams: () => new URLSearchParams(),
}));

const signedIn: AuthService = {
  ...unavailableAuthService,
  mode: "backend",
  getSession: async () => ({ source: "backend", customer: { id: "c1", full_name: "Asha Rao", email: null, phone: "+919876543210" } }),
};
const review = { id: "r1", product_id: "p1", rating: 4, title: "Fresh", body: "Well packed", customer_name: "Ravi K.", created_at: "2026-11-15T10:00:00Z",
  updated_at: "2026-11-15T10:00:00Z", verified_purchase: true, seller_reply: "Thank you!", seller_replied_at: "2026-11-15T12:00:00Z" };
const listed: ReviewList = { reviews: [review], average_rating: 4, review_count: 1, rating_counts: { "5": 0, "4": 1, "3": 0, "2": 0, "1": 0 } };

function fake(mine: MyReview, overrides: Partial<ReviewsService> = {}) {
  return { list: vi.fn(async () => listed), mine: vi.fn(async () => mine), submit: vi.fn(async () => ({ can_review: true, status: "published", review: { ...review, id: "r2", rating: 5 } }) as MyReview), ...overrides };
}

describe("product reviews", () => {
  it("uses the review routes", async () => {
    const calls: unknown[] = [];
    const client: ApiClient = { request: async <T,>(path: string, options?: unknown) => { calls.push([path, options]); return {} as T; } };
    const service = createHttpReviews(client);
    await service.list("p 1");
    await service.mine("p1");
    await service.submit("p1", { rating: 5, body: "Good" });
    expect(calls).toEqual([
      ["/products/p%201/reviews", { query: { limit: "50" } }],
      ["/products/p1/reviews/mine", undefined],
      ["/products/p1/reviews", { method: "POST", body: { rating: 5, body: "Good" } }],
    ]);
  });

  it("shows the average, the reviews and the seller's reply, and asks guests to sign in", async () => {
    render(<AppProviders authService={unavailableAuthService}><ProductReviews productId="p1" service={fake({ can_review: false })} /></AppProviders>);
    expect(await screen.findByText("4.0")).toBeInTheDocument();
    expect(screen.getByText("1 review")).toBeInTheDocument();
    expect(screen.getByText("Well packed")).toBeInTheDocument();
    expect(screen.getByText(/Ravi K\./)).toBeInTheDocument();
    expect(screen.getByText("Verified purchase")).toBeInTheDocument();
    expect(screen.getByText("Thank you!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", expect.stringContaining("reviews"));
    expect(screen.queryByRole("button", { name: "Submit review" })).toBeNull();
  });

  it("lets a customer who ordered it pick stars and submit", async () => {
    const service = fake({ can_review: true });
    render(<AppProviders authService={signedIn}><ProductReviews productId="p1" service={service} /></AppProviders>);
    const submit = await screen.findByRole("button", { name: "Submit review" });
    await act(async () => fireEvent.click(submit));
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a rating");
    fireEvent.click(screen.getByLabelText("5 stars"));
    fireEvent.change(screen.getByLabelText(/Your review/), { target: { value: "  Lovely  " } });
    await act(async () => fireEvent.click(submit));
    expect(service.submit).toHaveBeenCalledWith("p1", { rating: 5, body: "Lovely" });
    expect(await screen.findByText("Thank you! Your review is published.")).toBeInTheDocument();
    await waitFor(() => expect(service.list).toHaveBeenCalledTimes(2)); // the list is read again
  });

  it("explains when the customer hasn't ordered it, and shows the store's refusal", async () => {
    render(<AppProviders authService={signedIn}><ProductReviews productId="p1" service={fake({ can_review: false })} /></AppProviders>);
    expect(await screen.findByText(/once you’ve ordered it/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit review" })).toBeNull();
  });

  it("edits an existing review and surfaces errors", async () => {
    const service = fake({ can_review: true, status: "published", review }, {
      submit: vi.fn(async () => { throw new ApiError("review_not_allowed", "You can review a product once you've ordered it.", 403); }),
    });
    render(<AppProviders authService={signedIn}><ProductReviews productId="p1" service={service} /></AppProviders>);
    const update = await screen.findByRole("button", { name: "Update review" });
    expect(screen.getByLabelText(/Your review/)).toHaveValue("Well packed");
    await act(async () => fireEvent.click(update));
    expect(await screen.findByRole("alert")).toHaveTextContent("once you've ordered it");
  });
});
