import { useEffect } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountOverview } from "@/components/account/AccountOverview";
import { AppProviders } from "@/context/AppProviders";
import { useWishlist } from "@/context/WishlistContext";
import { ApiError, type ApiClient } from "@/lib/api-client";
import { unavailableAuthService } from "@/services/auth/unavailable";
import { createHttpWishlist, type WishlistService } from "@/services/wishlist";
import type { OrdersService } from "@/services/orders";
import type { AuthService } from "@/types/auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/account",
  useSearchParams: () => new URLSearchParams(),
}));

const signedIn: AuthService = {
  ...unavailableAuthService,
  mode: "backend",
  getSession: async () => ({ source: "backend", customer: { id: "c1", full_name: "Asha Rao", email: null, phone: "+919876543210" } }),
};

function fakeWishlist(initial: string[] = []) {
  let saved = [...initial];
  return {
    list: vi.fn(async () => [...saved]),
    add: vi.fn(async (id: string) => { saved = [id, ...saved.filter((s) => s !== id)]; }),
    remove: vi.fn(async (id: string) => { saved = saved.filter((s) => s !== id); }),
    merge: vi.fn(async (ids: string[]) => { saved = [...new Set([...saved, ...ids])]; return [...saved]; }),
  } satisfies WishlistService;
}

const noOrders: OrdersService = {
  list: async () => [],
  get: async () => { throw new ApiError("order_not_found", "x", 404); },
  place: async () => { throw new Error("unused"); },
  cancel: async () => { throw new Error("unused"); },
};

let wishlist: ReturnType<typeof useWishlist> | undefined;
function Probe() {
  const value = useWishlist();
  useEffect(() => {
    wishlist = value;
  });
  return <p data-testid="ids">{value.hydrated ? value.ids.join(",") || "none" : "loading"}</p>;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  wishlist = undefined;
});

describe("wishlist service", () => {
  it("uses the account routes", async () => {
    const calls: unknown[] = [];
    const client: ApiClient = { request: async <T,>(path: string, options?: unknown) => { calls.push([path, options]); return { items: [{ product_id: "p1", added_at: "x" }] } as T; } };
    const service = createHttpWishlist(client);
    expect(await service.list()).toEqual(["p1"]);
    await service.add("p 2");
    await service.remove("p1");
    expect(await service.merge(["a"])).toEqual(["p1"]);
    expect(calls).toEqual([
      ["/customer/wishlist", undefined],
      ["/customer/wishlist/p%202", { method: "PUT" }],
      ["/customer/wishlist/p1", { method: "DELETE" }],
      ["/customer/wishlist/merge", { method: "POST", body: { product_ids: ["a"] } }],
    ]);
  });
});

describe("the wishlist of a signed-in customer", () => {
  it("adds the browser's hearts to the account on sign-in, then clears them here", async () => {
    localStorage.setItem("mithren.wishlist", JSON.stringify(["p-local"]));
    const service = fakeWishlist(["p-account"]);
    render(<AppProviders authService={signedIn} wishlistService={service}><Probe /></AppProviders>);
    await waitFor(() => expect(screen.getByTestId("ids")).toHaveTextContent("p-account,p-local"));
    expect(service.merge).toHaveBeenCalledWith(["p-local"]);
    await waitFor(() => expect(JSON.parse(localStorage.getItem("mithren.wishlist")!)).toEqual([]));
  });

  it("reads the account list without merging when nothing was saved here", async () => {
    const service = fakeWishlist(["p-account"]);
    render(<AppProviders authService={signedIn} wishlistService={service}><Probe /></AppProviders>);
    await waitFor(() => expect(screen.getByTestId("ids")).toHaveTextContent("p-account"));
    expect(service.merge).not.toHaveBeenCalled();
  });

  it("saves and removes through the account, showing the change at once", async () => {
    const service = fakeWishlist();
    render(<AppProviders authService={signedIn} wishlistService={service}><Probe /></AppProviders>);
    await waitFor(() => expect(service.list).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId("ids")).toHaveTextContent("none"));
    act(() => void wishlist!.toggle("p1"));
    expect(screen.getByTestId("ids")).toHaveTextContent("p1");
    expect(service.add).toHaveBeenCalledWith("p1");
    act(() => void wishlist!.toggle("p1"));
    expect(screen.getByTestId("ids")).toHaveTextContent("none");
    expect(service.remove).toHaveBeenCalledWith("p1");
    expect(localStorage.getItem("mithren.wishlist")).toBeNull(); // nothing is kept in the browser
  });

  it("undoes a change the store refuses and says so", async () => {
    const service = { ...fakeWishlist(), add: vi.fn(async () => { throw new ApiError("network_error", "x", null); }) };
    render(<AppProviders authService={signedIn} wishlistService={service}><Probe /></AppProviders>);
    await waitFor(() => expect(service.list).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId("ids")).toHaveTextContent("none"));
    await act(async () => void wishlist!.toggle("p1"));
    await waitFor(() => expect(screen.getByTestId("ids")).toHaveTextContent("none"));
    expect(await screen.findByText("Your wishlist couldn't be updated")).toBeInTheDocument();
  });

  it("keeps a guest's wishlist in this browser", async () => {
    const service = fakeWishlist();
    render(<AppProviders authService={unavailableAuthService} wishlistService={service}><Probe /></AppProviders>);
    await waitFor(() => expect(screen.getByTestId("ids")).toHaveTextContent("none"));
    act(() => void wishlist!.toggle("p1"));
    expect(JSON.parse(localStorage.getItem("mithren.wishlist")!)).toEqual(["p1"]);
    expect(service.add).not.toHaveBeenCalled();
  });
});

describe("the account overview", () => {
  it("shows a signed-in customer their own account, not the demo", async () => {
    localStorage.setItem("mithren.addresses", JSON.stringify([]));
    render(
      <AppProviders authService={signedIn} wishlistService={fakeWishlist(["p1", "p2"])} ordersService={noOrders}>
        <AccountOverview />
      </AppProviders>,
    );
    expect(await screen.findByRole("heading", { name: "Hello, Asha" })).toBeInTheDocument();
    expect(screen.getByText(/signed in as \+91 98765 43210/i)).toBeInTheDocument();
    expect(screen.queryByText(/this is the demo account/i)).toBeNull();
    await waitFor(() => expect(screen.getByText("2 saved items")).toBeInTheDocument());
    expect(await screen.findByText("0 orders")).toBeInTheDocument();
    expect(screen.getByText(/orders you place appear here/i)).toBeInTheDocument();
  });

  it("keeps the demo account's sample profile and notice", async () => {
    render(<AppProviders authService={unavailableAuthService}><AccountOverview /></AppProviders>);
    expect(await screen.findByText(/this is the demo account/i)).toBeInTheDocument();
  });
});
