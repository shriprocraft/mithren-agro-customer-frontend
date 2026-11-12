import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewStep } from "@/components/checkout/ReviewStep";
import { AppProviders } from "@/context/AppProviders";
import { useCart } from "@/context/CartContext";
import { products } from "@/data/products";
import { quoteErrorMessage } from "@/hooks/useCheckoutQuote";
import { ApiError, type ApiClient } from "@/lib/api-client";
import { itemKey, resolveLines } from "@/lib/cart";
import { applyQuote, quoteFingerprint, toQuoteItems } from "@/lib/checkout-quote";
import { createHttpCheckoutQuotes } from "@/services/checkout";
import { unavailableAuthService } from "@/services/auth/unavailable";
import type { AuthService } from "@/types/auth";
import type { CartItem } from "@/types/cart";
import type { Quote, QuoteLine } from "@/types/checkout";

// The quote service is replaced: in tests the catalogue source is "sample", where it is normally off.
const quoteMock = vi.hoisted(() => vi.fn());
vi.mock("@/services/checkout", async (original) => ({
  ...(await original<typeof import("@/services/checkout")>()),
  checkoutQuotes: { quote: (...args: unknown[]) => quoteMock(...args) },
}));
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/checkout/review",
  useSearchParams: () => new URLSearchParams(),
}));

const tomatoes = products.find((p) => p.id === "p-tomatoes")!;
const papaya = products.find((p) => p.id === "p-papaya")!;
const items: CartItem[] = [
  { product_id: tomatoes.id, variant_id: "1kg", quantity: 2 },
  { product_id: papaya.id, quantity: 1 },
  { product_id: "p-gone", quantity: 1 },
];

function line(index: number, extra: Partial<QuoteLine> = {}): QuoteLine {
  const item = items[index]!;
  return {
    item_index: index, product_id: item.product_id, ...(item.variant_id && { variant_id: item.variant_id }), vendor_id: "v",
    name: "x", description: "x", quantity: item.quantity, unit_price: 4000, list_unit_price: 4000, line_total: 4000 * item.quantity,
    stock_status: "in_stock", ...extra,
  };
}

function quote(lines: QuoteLine[], extra: Partial<Quote> = {}): Quote {
  const subtotal = lines.reduce((sum, l) => sum + l.line_total, 0);
  return {
    currency: "INR", lines, unavailable: [], item_count: lines.reduce((n, l) => n + l.quantity, 0), subtotal, charges: [], total: subtotal,
    serviceability: "not_checked", blockers: [], can_checkout: true, priced_at: "2026-11-09T10:00:00Z", ...extra,
  };
}

describe("quote helpers", () => {
  it("sends items as stored, leaving out a missing option", () => {
    expect(toQuoteItems(items)).toEqual([
      { product_id: "p-tomatoes", variant_id: "1kg", quantity: 2 },
      { product_id: "p-papaya", quantity: 1 },
      { product_id: "p-gone", quantity: 1 },
    ]);
  });

  it("uses the server's prices, issues and totals, and never changes a quantity", () => {
    const { lines } = resolveLines(items, products);
    const server = quote([line(0, { unit_price: 4200, line_total: 8400, issue: "insufficient_stock" }), line(1, { unit_price: papaya.price, line_total: papaya.price })], {
      unavailable: [{ item_index: 2, product_id: "p-gone" }],
      blockers: [{ code: "unavailable_items", message: "Some items are no longer available." }],
      can_checkout: false,
    });
    const result = applyQuote(lines, items, server);
    expect(result.lines.map((l) => [l.key, l.quantity, l.unit_price, l.line_total, l.issue])).toEqual([
      ["p-tomatoes::1kg", 2, 4200, 8400, "insufficient_stock"],
      ["p-papaya", 1, papaya.price, papaya.price, undefined],
    ]);
    expect(result.summary).toEqual({ subtotal: 8400 + papaya.price, charges: [], total: 8400 + papaya.price, count: 3 });
    expect(result.unavailableKeys).toEqual(["p-gone"]);
    expect(result.blocker).toBe("Some items are no longer available.");
    expect(result.pricesChanged).toBe(true);
  });

  it("notices no change when the server agrees with the page", () => {
    const { lines } = resolveLines(items.slice(0, 2), products);
    const agree = quote(lines.map((l, i) => line(i, { unit_price: l.unit_price, line_total: l.line_total })));
    expect(applyQuote(lines, items, agree).pricesChanged).toBe(false);
  });

  it("fingerprints what the customer reviewed", () => {
    const a = quote([line(0)]);
    expect(quoteFingerprint(a)).toBe(quoteFingerprint({ ...a, priced_at: "later" }));
    expect(quoteFingerprint(a)).not.toBe(quoteFingerprint(quote([line(0, { unit_price: 4100, line_total: 8200 })])));
    expect(quoteFingerprint(a)).not.toBe(quoteFingerprint(quote([line(0, { issue: "out_of_stock" })])));
  });

  it("posts the items, with an address only when there is one", async () => {
    const calls: unknown[] = [];
    const client: ApiClient = { request: async <T,>(path: string, options?: unknown) => { calls.push([path, options]); return quote([]) as T; } };
    const service = createHttpCheckoutQuotes(client);
    await service.quote([{ product_id: "p", quantity: 1 }]);
    await service.quote([{ product_id: "p", quantity: 1 }], "addr-1");
    expect(calls).toEqual([
      ["/checkout/quote", { method: "POST", body: { items: [{ product_id: "p", quantity: 1 }] }, timeoutMs: 10_000 }],
      ["/checkout/quote", { method: "POST", body: { items: [{ product_id: "p", quantity: 1 }], address_id: "addr-1" }, timeoutMs: 10_000 }],
    ]);
  });

  it("explains failures in plain words", () => {
    expect(quoteErrorMessage(new ApiError("address_not_found", "x", 404))).toMatch(/address wasn't found/);
    expect(quoteErrorMessage(new ApiError("session_expired", "x", 401))).toMatch(/sign in again/);
    expect(quoteErrorMessage(new ApiError("network_error", "x", null))).toMatch(/connection/);
    expect(quoteErrorMessage(new Error("boom"))).toMatch(/couldn't check prices/);
  });
});

describe("review step with a server quote", () => {
  const signedIn: AuthService = {
    ...unavailableAuthService,
    mode: "backend",
    getSession: async () => ({ source: "backend", customer: { id: "c1", full_name: "Asha Rao", email: null, phone: "+919876543210" } }),
  };
  const address = {
    id: "a1", full_name: "Asha Rao", mobile: "9876543210", house: "12B", street: "MG Road", landmark: null, city: "Bengaluru",
    state: "Karnataka", pincode: "560001", type: "home", latitude: null, longitude: null,
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    quoteMock.mockReset();
    push.mockReset();
    localStorage.setItem("mithren.cart", JSON.stringify([items[0]]));
    localStorage.setItem("mithren.addresses", JSON.stringify([address]));
    sessionStorage.setItem("mithren.checkout", JSON.stringify({ source: { kind: "cart" }, address_id: "a1" }));
  });

  const priced = (unit: number) => quote([line(0, { unit_price: unit, line_total: unit * 2 })]);

  it("shows the server's prices and asks for a second look when they change before ordering", async () => {
    quoteMock.mockResolvedValueOnce(priced(4000)).mockResolvedValueOnce(priced(4500)).mockResolvedValue(priced(4500));
    render(<AppProviders authService={signedIn}><ReviewStep catalog={products} /></AppProviders>);

    const place = await screen.findByRole("button", { name: /place order/i });
    expect(screen.getAllByText("₹80").length).toBeGreaterThan(0);
    expect(quoteMock).toHaveBeenLastCalledWith([{ product_id: "p-tomatoes", variant_id: "1kg", quantity: 2 }], "a1");

    // The price changed on the server: nothing is ordered, the new total is shown with a notice.
    await act(async () => fireEvent.click(place));
    expect(await screen.findByText(/prices or stock changed/i)).toBeInTheDocument();
    expect(screen.getAllByText("₹90").length).toBeGreaterThan(0);
    expect(localStorage.getItem("mithren.orders")).toBeNull();
    expect(push).not.toHaveBeenCalled();

    // A click after seeing the new quote places the order at the server's price.
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /place order/i })));
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/orders\/MA-\d{8}-[A-Z0-9]{6}\/confirmation$/)));
    const [order] = JSON.parse(localStorage.getItem("mithren.orders")!);
    expect(order.items[0]).toMatchObject({ product_id: "p-tomatoes", quantity: 2, unit_price: 4500, line_total: 9000 });
    expect(order.total).toBe(9000);
  });

  it("shows an empty cart as nothing to review instead of waiting for a quote", async () => {
    localStorage.setItem("mithren.cart", "[]");
    render(<AppProviders authService={signedIn}><ReviewStep catalog={products} /></AppProviders>);

    expect(await screen.findByText("There’s nothing to review")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute("href", "/products");
    expect(screen.queryByText(/checking prices and stock/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /place order/i })).toBeNull();
    expect(quoteMock).not.toHaveBeenCalled();
  });

  it("never shows an earlier quote once the cart has emptied", async () => {
    let cart: ReturnType<typeof useCart> | undefined;
    function CartProbe() {
      cart = useCart();
      return null;
    }
    quoteMock.mockResolvedValue(priced(4000));
    render(<AppProviders authService={signedIn}><CartProbe /><ReviewStep catalog={products} /></AppProviders>);
    await screen.findByRole("button", { name: /place order/i });

    act(() => cart!.removeItem(itemKey(items[0]!)));

    expect(await screen.findByText("There’s nothing to review")).toBeInTheDocument();
    expect(screen.queryByText("₹80")).toBeNull();
    expect(screen.queryByRole("button", { name: /place order/i })).toBeNull();
    expect(quoteMock).toHaveBeenCalledTimes(1);
  });

  it("blocks ordering when the server reports a stock problem, without changing the quantity", async () => {
    quoteMock.mockResolvedValue(quote([line(0, { issue: "insufficient_stock" })], {
      can_checkout: false, blockers: [{ code: "insufficient_stock", message: "There isn't enough stock for some items. Lower their quantity to continue." }],
    }));
    render(<AppProviders authService={signedIn}><ReviewStep catalog={products} /></AppProviders>);
    expect(await screen.findByText(/isn't enough stock/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /place order/i })).toBeNull();
    expect(JSON.parse(localStorage.getItem("mithren.cart")!)[0].quantity).toBe(2);
  });
});
