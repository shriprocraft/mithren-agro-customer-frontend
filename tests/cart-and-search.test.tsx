import { useEffect } from "react";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/context/AppProviders";
import { useCart } from "@/context/CartContext";
import { useCatalogSearch } from "@/hooks/useCatalogSearch";
import type { ApiClient } from "@/lib/api-client";
import { itemKey } from "@/lib/cart";
import { emptyCriteria, type MarketplaceCriteria } from "@/lib/marketplace";
import { unavailableAuthService } from "@/services/auth/unavailable";
import { createHttpCart, type CartService } from "@/services/cart";
import { createHttpCatalogSearch, searchQuery, type CatalogSearchService } from "@/services/catalog-search";
import type { AuthService } from "@/types/auth";
import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/catalog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/cart",
  useSearchParams: () => new URLSearchParams(),
}));

const signedIn: AuthService = {
  ...unavailableAuthService,
  mode: "backend",
  getSession: async () => ({ source: "backend", customer: { id: "c1", full_name: "Asha Rao", email: null, phone: "+919876543210" } }),
};

/** An in-memory /customer/cart that behaves like the API (PUT sets, merge keeps the larger quantity). */
function fakeCart(initial: CartItem[] = []) {
  let lines = [...initial];
  const key = (item: CartItem) => itemKey(item);
  return {
    list: vi.fn(async () => [...lines]),
    set: vi.fn(async (item: CartItem) => {
      lines = lines.some((l) => key(l) === key(item)) ? lines.map((l) => (key(l) === key(item) ? item : l)) : [...lines, item];
      return [...lines];
    }),
    remove: vi.fn(async (productId: string, variantId?: string) => {
      lines = lines.filter((l) => key(l) !== key({ product_id: productId, variant_id: variantId, quantity: 1 }));
    }),
    clear: vi.fn(async () => { lines = []; }),
    merge: vi.fn(async (items: CartItem[]) => {
      for (const item of items) {
        const existing = lines.find((l) => key(l) === key(item));
        lines = existing ? lines.map((l) => (l === existing ? { ...l, quantity: Math.max(l.quantity, item.quantity) } : l)) : [...lines, item];
      }
      return [...lines];
    }),
  } satisfies CartService;
}

let cart: ReturnType<typeof useCart> | undefined;
function Probe() {
  const value = useCart();
  useEffect(() => {
    cart = value;
  });
  return <p data-testid="cart">{value.hydrated ? value.items.map((i) => `${itemKey(i)}x${i.quantity}`).join(",") || "empty" : "loading"}</p>;
}
const show = () => screen.getByTestId("cart");

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  cart = undefined;
});

describe("cart service", () => {
  it("uses the account routes, sending absolute quantities and the option", async () => {
    const calls: unknown[] = [];
    const client: ApiClient = {
      request: async <T,>(path: string, options?: unknown) => {
        calls.push([path, options]);
        return { items: [{ product_id: "p1", variant_id: null, quantity: 2 }, { product_id: "p2", variant_id: "v1", quantity: 1 }] } as T;
      },
    };
    const service = createHttpCart(client);
    expect(await service.list()).toEqual([{ product_id: "p1", quantity: 2 }, { product_id: "p2", variant_id: "v1", quantity: 1 }]);
    await service.set({ product_id: "p 2", variant_id: "v1", quantity: 3 });
    await service.remove("p2", "v1");
    await service.remove("p1");
    await service.clear();
    await service.merge([{ product_id: "p3", quantity: 1 }]);
    expect(calls).toEqual([
      ["/customer/cart", undefined],
      ["/customer/cart/p%202", { method: "PUT", body: { variant_id: "v1", quantity: 3 } }],
      ["/customer/cart/p2", { method: "DELETE", query: { variant_id: "v1" } }],
      ["/customer/cart/p1", { method: "DELETE" }],
      ["/customer/cart", { method: "DELETE" }],
      ["/customer/cart/merge", { method: "POST", body: { items: [{ product_id: "p3", variant_id: null, quantity: 1 }] } }],
    ]);
  });
});

describe("the cart of a signed-in customer", () => {
  it("merges the browser's cart into the account on sign-in, then clears it here", async () => {
    localStorage.setItem("mithren.cart", JSON.stringify([{ product_id: "p-local", quantity: 2 }]));
    const service = fakeCart([{ product_id: "p-account", variant_id: "1kg", quantity: 1 }]);
    render(<AppProviders authService={signedIn} cartService={service}><Probe /></AppProviders>);
    await waitFor(() => expect(show()).toHaveTextContent("p-account::1kgx1,p-localx2"));
    expect(service.merge).toHaveBeenCalledWith([{ product_id: "p-local", quantity: 2 }]);
    expect(JSON.parse(localStorage.getItem("mithren.cart")!)).toEqual([]);
  });

  it("sends every change to the API: add, steppers, remove, and emptying after an order", async () => {
    const service = fakeCart();
    render(<AppProviders authService={signedIn} cartService={service}><Probe /></AppProviders>);
    await waitFor(() => expect(show()).toHaveTextContent("empty"));
    expect(service.list).toHaveBeenCalledTimes(1);

    act(() => void cart!.addItem("p1", 2, "1kg"));
    expect(show()).toHaveTextContent("p1::1kgx2"); // at once, before the API answers
    act(() => void cart!.addItem("p1", 1, "1kg"));
    act(() => void cart!.addItem("p2"));
    await waitFor(() => expect(service.set).toHaveBeenLastCalledWith({ product_id: "p2", quantity: 1 }));
    expect(service.set).toHaveBeenCalledWith({ product_id: "p1", variant_id: "1kg", quantity: 3 });

    act(() => cart!.setQuantity("p1::1kg", 5));
    await waitFor(() => expect(service.set).toHaveBeenLastCalledWith({ product_id: "p1", variant_id: "1kg", quantity: 5 }));
    act(() => void cart!.removeItem("p2"));
    await waitFor(() => expect(service.remove).toHaveBeenCalledWith("p2", undefined));
    await waitFor(() => expect(show()).toHaveTextContent("p1::1kgx5"));

    act(() => cart!.removeItems(["p1::1kg"]));
    await waitFor(() => expect(service.clear).toHaveBeenCalledTimes(1));
    expect(show()).toHaveTextContent("empty");
    expect(localStorage.getItem("mithren.cart")).toBeNull(); // a signed-in cart never touches browser storage
  });

  it("undoes a change the store refuses", async () => {
    const service = fakeCart([{ product_id: "p1", quantity: 1 }]);
    service.set.mockRejectedValueOnce(new Error("offline"));
    render(<AppProviders authService={signedIn} cartService={service}><Probe /></AppProviders>);
    await waitFor(() => expect(show()).toHaveTextContent("p1x1"));
    act(() => cart!.setQuantity("p1", 4));
    expect(show()).toHaveTextContent("p1x4");
    await waitFor(() => expect(show()).toHaveTextContent("p1x1"));
    expect(await screen.findByText("Your cart couldn't be updated")).toBeInTheDocument();
  });

  it("guests keep the cart in this browser and never call the API", async () => {
    const service = fakeCart();
    render(<AppProviders authService={unavailableAuthService} cartService={service}><Probe /></AppProviders>);
    await waitFor(() => expect(show()).toHaveTextContent("empty"));
    act(() => void cart!.addItem("p1", 2));
    expect(JSON.parse(localStorage.getItem("mithren.cart")!)).toEqual([{ product_id: "p1", quantity: 2 }]);
    expect(Object.values(service).every((fn) => fn.mock.calls.length === 0)).toBe(true);
  });
});

describe("marketplace search through the API", () => {
  const criteria = (c: Partial<MarketplaceCriteria>): MarketplaceCriteria => ({ ...emptyCriteria, ...c });
  const product = (id: string) => ({ id, name: id }) as Product;

  it("maps every criterion to the API query (prices in paise)", () => {
    expect(searchQuery(emptyCriteria)).toEqual({ include_bundles: "true", sort: "relevance" });
    expect(
      searchQuery(criteria({
        query: "dal", categories: ["fruits", "vegetables"], minPrice: 10, maxPrice: 250, availability: ["in_stock"], sellers: ["v1", "v2"],
        units: ["1 kg"], seasonal: true, onSale: true, sort: "price-desc",
      })),
    ).toEqual({
      include_bundles: "true", sort: "price_desc", q: "dal", category: "fruits,vegetables", min_price: "1000", max_price: "25000",
      stock: "in_stock", vendor: "v1,v2", unit: "1 kg", seasonal: "true", on_sale: "true",
    });
  });

  it("pages through every result", async () => {
    const pages = [Array.from({ length: 100 }, (_, i) => product(`p${i}`)), [product("last")]];
    const request = vi.fn(async (_path: string, options?: { query?: Record<string, string> }) => ({ products: pages[Number(options!.query!.offset) / 100] ?? [], total: 101 }));
    const found = await createHttpCatalogSearch({ request: request as unknown as ApiClient["request"] }).search(criteria({ query: "x" }));
    expect(found).toHaveLength(101);
    expect(request.mock.calls.map(([path, options]) => [path, options!.query!.offset])).toEqual([["/catalog/products", "0"], ["/catalog/products", "100"]]);
  });

  it("shows the server's catalogue until something is chosen, then asks the API for every change", async () => {
    const service: CatalogSearchService = { search: vi.fn(async (c) => [product(`for:${c.query}`)]) };
    const initial = [product("all")];
    const { result, rerender } = renderHook(({ c }) => useCatalogSearch(c, initial, service), { initialProps: { c: emptyCriteria } });
    expect(result.current.state).toEqual({ status: "ready", products: initial });
    expect(service.search).not.toHaveBeenCalled();
    rerender({ c: criteria({ query: "dal" }) });
    await waitFor(() => expect(result.current.state).toEqual({ status: "ready", products: [product("for:dal")] }));
    rerender({ c: emptyCriteria }); // clearing everything asks again
    await waitFor(() => expect(service.search).toHaveBeenCalledTimes(2));
  });

  it("reports a failed search instead of filtering in the browser", async () => {
    const service: CatalogSearchService = { search: vi.fn(async () => { throw new Error("down"); }) };
    const { result } = renderHook(() => useCatalogSearch(criteria({ query: "dal" }), [product("all")], service));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    const none = renderHook(() => useCatalogSearch(criteria({ query: "dal" }), [], null));
    await waitFor(() => expect(none.result.current.state.status).toBe("error"));
  });
});
