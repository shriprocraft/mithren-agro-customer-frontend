import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountOrderView } from "@/components/account/AccountOrderView";
import { OrdersList } from "@/components/account/OrdersList";
import { ReviewStep } from "@/components/checkout/ReviewStep";
import { AppProviders } from "@/context/AppProviders";
import { products } from "./fixtures/catalog/products";
import { ApiError, type ApiClient } from "@/lib/api-client";
import { createHttpOrders, toOrder, type ApiOrder, type OrdersService } from "@/services/orders";
import { unavailableAuthService } from "@/services/auth/unavailable";
import type { AuthService } from "@/types/auth";
import type { Quote } from "@/types/checkout";
import type { Order } from "@/types/order";

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

const signedIn: AuthService = {
  ...unavailableAuthService,
  mode: "backend",
  getSession: async () => ({ source: "backend", customer: { id: "c1", full_name: "Asha Rao", email: null, phone: "+919876543210" } }),
};
const address = {
  id: "a1", full_name: "Asha Rao", mobile: "9876543210", house: "12B", street: "MG Road", landmark: null, city: "Bengaluru",
  state: "Karnataka", pincode: "560001", type: "home" as const, latitude: null, longitude: null,
};
const cartItem = { product_id: "p-tomatoes", variant_id: "1kg", quantity: 2 };

function priced(unit: number, version = `q1-${unit}`): Quote {
  return {
    currency: "INR",
    lines: [{ item_index: 0, product_id: "p-tomatoes", variant_id: "1kg", vendor_id: "v", name: "Tomatoes", description: "1 kg", quantity: 2, unit_price: unit, list_unit_price: unit, line_total: unit * 2, stock_status: "in_stock" }],
    unavailable: [], item_count: 2, subtotal: unit * 2, charges: [], total: unit * 2, serviceability: "not_checked",
    blockers: [], can_checkout: true, priced_at: "2026-11-12T06:00:00Z", pricing_version: version,
  };
}

function apiOrder(extra: Partial<ApiOrder> = {}): ApiOrder {
  return {
    id: "MA-20261112-ABC234", order_number: "MA-20261112-ABC234", created_at: "2026-11-12T06:00:00Z", status: "order_placed",
    payment_method: "cod", payment_status: "pending",
    items: [{ kind: "product", product_id: "p-tomatoes", variant_id: "1kg", vendor_id: "v", name: "Tomatoes", unit: "1 kg", category_slug: "vegetables",
      image_src: "/t.jpg", image_alt: "Tomatoes", unit_price: 4000, list_unit_price: 4000, quantity: 2, line_total: 8000 }],
    address: { ...address }, subtotal: 8000, charges: [], total: 8000, history: [{ status: "order_placed", at: "2026-11-12T06:00:00Z" }],
    cancellable: true, ...extra,
  };
}

function fakeOrders(overrides: Partial<OrdersService> = {}): OrdersService & { [K in keyof OrdersService]: ReturnType<typeof vi.fn> } {
  return {
    list: vi.fn(async () => [] as Order[]),
    get: vi.fn(async () => { throw new ApiError("order_not_found", "x", 404); }),
    place: vi.fn(async () => toOrder(apiOrder())),
    cancel: vi.fn(async () => toOrder(apiOrder({ status: "cancelled", payment_status: "void", cancellable: false, cancel_reason: "Cancelled by customer",
      history: [{ status: "order_placed", at: "2026-11-12T06:00:00Z" }, { status: "cancelled", at: "2026-11-12T07:00:00Z" }] }))),
    ...overrides,
  } as never;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  quoteMock.mockReset();
  push.mockReset();
  localStorage.setItem("mithren.cart", JSON.stringify([cartItem]));
  localStorage.setItem("mithren.addresses", JSON.stringify([address]));
  sessionStorage.setItem("mithren.checkout", JSON.stringify({ source: { kind: "cart" }, address_id: "a1" }));
});

describe("orders service", () => {
  it("maps the API order to the storefront's Order, keeping the address copy", () => {
    const order = toOrder(apiOrder({ address: { ...address, id: undefined } }));
    expect(order).toMatchObject({ id: "MA-20261112-ABC234", source: "backend", payment_method: "cod", cancellable: true, total: 8000 });
    expect(order.address).toMatchObject({ id: "", full_name: "Asha Rao", pincode: "560001" });
    expect(order.items[0]).toMatchObject({ category_slug: "vegetables", unit_price: 4000, quantity: 2 });
  });

  it("sends the idempotency key, COD and the reviewed prices", async () => {
    const calls: unknown[] = [];
    const client: ApiClient = { request: async <T,>(path: string, options?: unknown) => { calls.push([path, options]); return (path.endsWith("/customer/orders") && !options ? { orders: [] } : apiOrder()) as T; } };
    const service = createHttpOrders(client);
    const input = { items: [{ product_id: "p", quantity: 1 }], address_id: "a1", pricing_version: "q1-x", expected: { total: 100, lines: [{ item_index: 0, unit_price: 100 }] } };
    await service.place(input, "key-1");
    await service.cancel("MA-20261112-ABC234");
    expect(calls).toEqual([
      ["/customer/orders", { method: "POST", body: { ...input, payment_method: "cod" }, headers: { "Idempotency-Key": "key-1" }, timeoutMs: 15_000 }],
      ["/customer/orders/MA-20261112-ABC234/cancel", { method: "POST", body: {} }],
    ]);
  });
});

describe("placing a COD order with a backend account", () => {
  const renderReview = (orders: OrdersService) =>
    render(<AppProviders authService={signedIn} ordersService={orders}><ReviewStep catalog={products} /></AppProviders>);

  it("places the order through the API at the prices on screen and empties the cart", async () => {
    quoteMock.mockResolvedValue(priced(4000));
    const orders = fakeOrders();
    renderReview(orders);
    expect(await screen.findByText(/cash on delivery/i)).toBeInTheDocument();
    const button = await screen.findByRole("button", { name: /place order/i });
    await act(async () => fireEvent.click(button));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/orders/MA-20261112-ABC234/confirmation"));
    const [input, key] = orders.place.mock.calls[0]!;
    expect(input).toEqual({
      items: [cartItem], address_id: "a1", pricing_version: "q1-4000",
      expected: { total: 8000, lines: [{ item_index: 0, unit_price: 4000 }] },
    });
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.parse(localStorage.getItem("mithren.cart")!)).toEqual([]);
    expect(localStorage.getItem("mithren.orders")).toBeNull(); // nothing is kept in the browser
  });

  it("places nothing when the server's price changed, and shows the new quote", async () => {
    quoteMock.mockResolvedValue(priced(4000));
    const orders = fakeOrders({ place: vi.fn(async () => { throw new ApiError("quote_changed", "changed", 409); }) });
    renderReview(orders);
    const place = await screen.findByRole("button", { name: /place order/i });
    quoteMock.mockResolvedValue(priced(4000)); // the page and the final check agree; the server doesn't
    await act(async () => fireEvent.click(place));
    expect(await screen.findByText(/prices or stock changed/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("mithren.cart")!)).toHaveLength(1);
    await waitFor(() => expect(quoteMock.mock.calls.length).toBeGreaterThanOrEqual(3)); // asked again for the fresh quote
  });

  it("retries with the same key after a lost response, so the order can't be placed twice", async () => {
    quoteMock.mockResolvedValue(priced(4000));
    // The first response is lost on the way back; the second attempt succeeds.
    const place = vi.fn<OrdersService["place"]>(async () => {
      if (place.mock.calls.length === 1) throw new ApiError("network_error", "x", null);
      return toOrder(apiOrder());
    });
    renderReview(fakeOrders({ place }));
    const button = await screen.findByRole("button", { name: /place order/i });
    await act(async () => fireEvent.click(button));
    expect(await screen.findByText(/connection dropped/i)).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /place order/i })));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(place.mock.calls[0]![1]).toBe(place.mock.calls[1]![1]);
  });
});

describe("the customer's orders from the account", () => {
  it("lists the account's orders, not the browser's", async () => {
    localStorage.setItem("mithren.orders", "[]");
    const orders = fakeOrders({ list: vi.fn(async () => [toOrder(apiOrder())]) });
    render(<AppProviders authService={signedIn} ordersService={orders}><OrdersList /></AppProviders>);
    expect(await screen.findByText("MA-20261112-ABC234")).toBeInTheDocument();
  });

  it("cancels an order after confirmation and shows it as cancelled", async () => {
    const orders = fakeOrders({ list: vi.fn(async () => [toOrder(apiOrder())]) });
    const params = Promise.resolve({ orderId: "MA-20261112-ABC234" });
    // `use(params)` suspends: rendering inside an async act lets React finish once it resolves.
    await act(async () => {
      render(<AppProviders authService={signedIn} ordersService={orders}><Suspense fallback={null}><AccountOrderView params={params} /></Suspense></AppProviders>);
    });
    const cancel = await screen.findByRole("button", { name: "Cancel order" });
    await act(async () => fireEvent.click(cancel));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Yes, cancel order" })));
    expect((await screen.findAllByText(/this order was cancelled/i)).length).toBeGreaterThan(0);
    expect(orders.cancel).toHaveBeenCalledWith("MA-20261112-ABC234", undefined);
    expect(screen.queryByRole("button", { name: "Cancel order" })).toBeNull();
  });

  it("opens an order that isn't in the loaded list by asking the account", async () => {
    const orders = fakeOrders({ get: vi.fn(async () => toOrder(apiOrder())) });
    const params = Promise.resolve({ orderId: "MA-20261112-ABC234" });
    // `use(params)` suspends: rendering inside an async act lets React finish once it resolves.
    await act(async () => {
      render(<AppProviders authService={signedIn} ordersService={orders}><Suspense fallback={null}><AccountOrderView params={params} /></Suspense></AppProviders>);
    });
    expect(await screen.findByRole("heading", { name: "Order details" })).toBeInTheDocument();
    expect(orders.get).toHaveBeenCalledWith("MA-20261112-ABC234");
  });
});
