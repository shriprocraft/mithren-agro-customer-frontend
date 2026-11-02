import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginView } from "@/components/account/LoginView";
import { CheckoutAuthGate } from "@/components/auth/CheckoutAuthGate";
import { resolveApiBaseUrl } from "@/config/api";
import { AppProviders } from "@/context/AppProviders";
import { useCart } from "@/context/CartContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { OrderAuthError, useOrders } from "@/context/OrdersContext";
import { ApiError, createApiClient, type ApiClient } from "@/lib/api-client";
import { AuthError } from "@/lib/auth-errors";
import { canPlaceOrder, signInHref } from "@/lib/checkout-auth";
import { resolveAuthMode } from "@/services/auth";
import { createDevelopmentMockAuthService, MOCK_SESSION_KEY } from "@/services/auth/development-mock";
import { createHttpAuthService } from "@/services/auth/http";
import { unavailableAuthService } from "@/services/auth/unavailable";
import type { AuthService, AuthSession } from "@/types/auth";
import type { Address } from "@/types/order";

const replace = vi.fn();
let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/login",
  useSearchParams: () => search,
}));

const realSession: AuthSession = { source: "backend", customer: { id: "c1", full_name: "Asha", email: null, phone: "+919876543210" } };
const signedIn = (session: AuthSession = realSession): AuthService => ({ ...unavailableAuthService, mode: "backend", getSession: async () => session });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  replace.mockClear();
  search = new URLSearchParams();
});
afterEach(() => vi.useRealTimers());

describe("adapter selection fails closed", () => {
  it("needs a valid URL for backend mode and refuses the mock in production", () => {
    expect(resolveAuthMode({ mode: "backend", apiBaseUrl: "https://api.example.com", nodeEnv: "production" })).toBe("backend");
    expect(resolveAuthMode({ mode: "backend", apiBaseUrl: null, nodeEnv: "production" })).toBe("unavailable");
    expect(resolveAuthMode({ mode: "mock", apiBaseUrl: null, nodeEnv: "development" })).toBe("development_mock");
    expect(resolveAuthMode({ mode: "mock", apiBaseUrl: "https://api.example.com", nodeEnv: "production" })).toBe("unavailable");
    expect(resolveAuthMode({ mode: undefined, apiBaseUrl: "https://api.example.com", nodeEnv: "development" })).toBe("unavailable");
    expect(() => createDevelopmentMockAuthService("production")).toThrow(/cannot run in a production build/);
    expect(resolveApiBaseUrl("https://api.example.com/v1/")).toBe("https://api.example.com/v1");
    expect(resolveApiBaseUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("order rule", () => {
  it("needs a verified session; a mock session is refused in production", () => {
    expect(canPlaceOrder(null)).toBe(false);
    expect(canPlaceOrder(realSession, "production")).toBe(true);
    const mock: AuthSession = { source: "development_mock", customer: { id: "dev-mock-1", full_name: null, email: "a@example.com", phone: null } };
    expect(canPlaceOrder(mock, "development")).toBe(true);
    expect(canPlaceOrder(mock, "production")).toBe(false);
    expect(signInHref("/checkout/review")).toBe("/login?next=%2Fcheckout%2Freview");
  });

  const address = { id: "a", full_name: "Asha", mobile: "9876543210", house: "1", street: "Main", city: "Chennai", state: "Tamil Nadu", pincode: "600001", type: "home" } as Address;
  let orders: ReturnType<typeof useOrders>;
  let demo: ReturnType<typeof useDemoAccount>;
  function Probe() {
    orders = useOrders();
    demo = useDemoAccount();
    return null;
  }

  it("placeOrder rejects a guest, even with the demo account open, and stores nothing", async () => {
    render(<AppProviders authService={unavailableAuthService}><Probe /></AppProviders>);
    await act(async () => {});
    act(() => demo.startDemoSession());
    const before = orders.orders.length;
    expect(() => orders.placeOrder([], address)).toThrow(OrderAuthError);
    expect(orders.orders).toHaveLength(before);
  });
});

describe("checkout gate", () => {
  const gate = (service: AuthService) =>
    render(<AppProviders authService={service}><CheckoutAuthGate next="/checkout/review"><p>Checkout step</p></CheckoutAuthGate></AppProviders>);

  it("sends a guest to sign-in with the right return step and doesn't show checkout", async () => {
    gate(unavailableAuthService);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?next=%2Fcheckout%2Freview"));
    expect(screen.queryByText("Checkout step")).toBeNull();
  });

  it("treats a failed session check as signed out", async () => {
    gate({ ...unavailableAuthService, mode: "backend", getSession: () => Promise.reject(new AuthError("network_error")) });
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(screen.queryByText("Checkout step")).toBeNull();
  });

  it("lets a signed-in customer through without asking again", async () => {
    gate(signedIn());
    expect(await screen.findByText("Checkout step")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not count the demo account as signed in", async () => {
    localStorage.setItem("mithren.demo-session", JSON.stringify({ kind: "demo", started_at: new Date().toISOString() }));
    gate(unavailableAuthService);
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(screen.queryByText("Checkout step")).toBeNull();
  });
});

describe("sign-in screens with the development mock", () => {
  let cart: ReturnType<typeof useCart>;
  function CartProbe() {
    cart = useCart();
    return null;
  }
  const view = (service: AuthService = createDevelopmentMockAuthService("test")) =>
    render(<AppProviders authService={service}><CartProbe /><LoginView /></AppProviders>);

  const requestCode = async () => {
    fireEvent.change(await screen.findByLabelText("Mobile number"), { target: { value: "98765 43210" } });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    return (await screen.findByTestId("development-code")).textContent!;
  };
  const submitCode = (code: string) => {
    fireEvent.change(screen.getByLabelText("One-time code"), { target: { value: code } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));
  };

  it("validates the phone number and email before sending anything", async () => {
    view();
    fireEvent.change(await screen.findByLabelText("Mobile number"), { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    expect(screen.getByText(/valid 10-digit Indian mobile number/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Email" }));
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    expect(screen.getByText(/email address like/)).toBeInTheDocument();
  });

  it("returns to the checkout step after signing in, with the cart intact and no code stored", async () => {
    search = new URLSearchParams("next=/checkout/address");
    view();
    await screen.findByLabelText("Mobile number");
    act(() => void cart.addItem("p-tomatoes", 2));
    const code = await requestCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(screen.getByRole("button", { name: /Resend code in \d+s/ })).toBeDisabled();
    submitCode(code);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/checkout/address"));
    expect(cart.items).toEqual([expect.objectContaining({ product_id: "p-tomatoes", quantity: 2 })]);
    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    expect(stored).not.toContain(code);
    expect(JSON.parse(sessionStorage.getItem(MOCK_SESSION_KEY)!).customer.id).toMatch(/^dev-mock-/);
  });

  it("generates a different code each time", async () => {
    const mock = createDevelopmentMockAuthService("test");
    const codes = new Set<string | undefined>();
    for (let i = 0; i < 6; i++) codes.add((await mock.requestOtp({ channel: "email", destination: "a@example.com" })).development_code);
    expect(codes.size).toBeGreaterThan(1);
  });

  it("reports an invalid code and stays signed out", async () => {
    view();
    const code = await requestCode();
    submitCode(code === "000000" ? "000001" : "000000");
    expect(await screen.findByText(/That code isn’t correct/)).toBeInTheDocument();
    expect(sessionStorage.getItem(MOCK_SESSION_KEY)).toBeNull();
  });

  it("reports an expired code and offers a new one straight away", async () => {
    const now = Date.now();
    const clock = vi.spyOn(Date, "now").mockReturnValue(now);
    view();
    const code = await requestCode();
    clock.mockReturnValue(now + 301_000);
    submitCode(code);
    expect(await screen.findByText(/That code has expired/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify and continue" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled();
    clock.mockRestore();
  });

  it("shows a network failure when a code can't be requested", async () => {
    view({ ...createDevelopmentMockAuthService("test"), requestOtp: () => Promise.reject(new AuthError("network_error")) });
    fireEvent.change(await screen.findByLabelText("Mobile number"), { target: { value: "9876543210" } });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    expect(await screen.findByText(/couldn’t reach the server/)).toBeInTheDocument();
  });

  it("never reports Google success without a real provider", async () => {
    view();
    fireEvent.click(await screen.findByRole("button", { name: "Continue with Google" }));
    expect(await screen.findByText(/Google sign-in isn’t connected yet. You have not been signed in/)).toBeInTheDocument();
    expect(sessionStorage.getItem(MOCK_SESSION_KEY)).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it("labels the mock, disables everything when unavailable, and has no password field", async () => {
    const { unmount } = view();
    expect(await screen.findByText(/Development sign-in, not a real account/)).toBeInTheDocument();
    unmount();
    view(unavailableAuthService);
    expect(await screen.findByText(/Sign-in isn’t connected on this site yet/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send code" })).toBeDisabled();
    expect(document.querySelector("input[type=password]")).toBeNull();
    expect(screen.getByRole("button", { name: /Explore Demo Account/ })).toBeInTheDocument();
  });

  it("shows the error the backend sends back from a failed Google sign-in", async () => {
    search = new URLSearchParams("auth_error=session_expired");
    view();
    expect(await screen.findByText(/Your session has ended/)).toBeInTheDocument();
  });
});

describe("backend adapter", () => {
  const client = (request: ApiClient["request"]): ApiClient => ({ request });
  const customer = realSession.customer;

  it("has a session only when the backend returns one", async () => {
    await expect(createHttpAuthService(client(async () => ({ customer } as never)), "https://api").getSession()).resolves.toEqual(realSession);
    await expect(createHttpAuthService(client(async () => ({ customer: null } as never)), "https://api").getSession()).resolves.toBeNull();
    await expect(createHttpAuthService(client(() => Promise.reject(new ApiError("x", "", 401))), "https://api").getSession()).resolves.toBeNull();
    await expect(createHttpAuthService(client(() => Promise.reject(new ApiError("network_error", "", null))), "https://api").getSession()).rejects.toMatchObject({ code: "network_error" });
  });

  it("sends the documented payloads and maps error codes", async () => {
    const request = vi.fn().mockResolvedValue({ customer });
    const service = createHttpAuthService(client(request), "https://api");
    await service.requestOtp({ channel: "phone", destination: "+919876543210" });
    expect(request).toHaveBeenLastCalledWith("/auth/otp/phone/request", { method: "POST", body: { phone: "+919876543210" } });
    await service.requestOtp({ channel: "email", destination: "a@example.com" });
    expect(request).toHaveBeenLastCalledWith("/auth/otp/email/request", { method: "POST", body: { email: "a@example.com" } });
    await service.verifyOtp({ channel: "email", challenge_id: "c", code: "123456" });
    expect(request).toHaveBeenLastCalledWith("/auth/otp/email/verify", { method: "POST", body: { challenge_id: "c", code: "123456" } });
    request.mockRejectedValueOnce(new ApiError("expired_otp", "", 400));
    await expect(service.verifyOtp({ channel: "phone", challenge_id: "c", code: "123456" })).rejects.toMatchObject({ code: "expired_otp" });
    request.mockResolvedValueOnce({});
    await expect(service.verifyOtp({ channel: "phone", challenge_id: "c", code: "123456" })).rejects.toBeInstanceOf(AuthError);
  });

  it("Google only leaves for the backend's start URL and reports no session itself", async () => {
    const navigate = vi.fn();
    const service = createHttpAuthService(client(vi.fn()), "https://api", navigate);
    await expect(service.startGoogleSignIn("/login?next=/checkout/address")).resolves.toBeUndefined();
    expect(navigate).toHaveBeenCalledWith("https://api/auth/google/start?return_to=%2Flogin%3Fnext%3D%2Fcheckout%2Faddress");
  });

  it("the API client sends cookies and normalises failures", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "rate_limited", message: "Slow", retry_after_seconds: 9 } }), { status: 429 }));
    const api = createApiClient("https://api", fetchImpl);
    await expect(api.request("/x")).rejects.toMatchObject({ code: "rate_limited", status: 429, retryAfterSeconds: 9 });
    expect(fetchImpl.mock.calls[0]![1]).toMatchObject({ credentials: "include" });
    await expect(createApiClient("https://api", vi.fn().mockRejectedValue(new TypeError("down"))).request("/x")).rejects.toMatchObject({ code: "network_error" });
  });
});
