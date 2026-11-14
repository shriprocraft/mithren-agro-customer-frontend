import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireSignIn } from "@/components/account/RequireSignIn";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { AppProviders } from "@/context/AppProviders";
import { unavailableAuthService } from "@/services/auth/unavailable";
import type { AuthService, AuthSession } from "@/types/auth";

// The header menu and the /account gate for each kind of visitor: a guest (with and without the backend)
// and a customer signed in through the backend. There is no demo account and no mock sign-in.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/account/orders",
  useSearchParams: () => new URLSearchParams(),
}));

const backendSession: AuthSession = { source: "backend", customer: { id: "cust-1", full_name: "Asha Ramesh", email: null, phone: "+919876543210" } };
const withSession = (session: AuthSession | null): AuthService => ({ ...unavailableAuthService, mode: "backend", getSession: async () => session });

const menu = async (service: AuthService, label: string | RegExp) => {
  render(<AppProviders authService={service} ordersService={null}><AccountMenu /></AppProviders>);
  act(() => fireEvent.click(screen.getByRole("button", { name: /Account:/ })));
  return screen.findByRole("button", { name: label });
};

const gate = (service: AuthService) =>
  render(<AppProviders authService={service}><RequireSignIn><p>Account page content</p></RequireSignIn></AppProviders>);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("account menu", () => {
  it("for a backend customer: their name, every account section, Sign out, and no demo or sample wording", async () => {
    await menu(withSession(backendSession), "Account: signed in as Asha Ramesh");
    expect(screen.getByText("Asha Ramesh")).toBeInTheDocument();
    for (const [name, href] of [
      ["My Account", "/account"],
      ["My Profile", "/account/profile"],
      ["My Orders", "/account/orders"],
      ["Track Orders", "/account/track"],
      ["My Addresses", "/account/addresses"],
      ["My Wishlist", "/account/wishlist"],
    ]) {
      expect(screen.getByRole("link", { name: name! })).toHaveAttribute("href", href);
    }
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.queryByText(/sample data|demo/i)).toBeNull();
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });

  it("names a backend customer without a name by their number", async () => {
    await menu(withSession({ ...backendSession, customer: { ...backendSession.customer, full_name: null } }), "Account: signed in as +919876543210");
  });

  it("for a guest with the backend: sign in, which creates the account; no demo account", async () => {
    await menu(withSession(null), "Account: sign in");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.getByText(/signing in for the first time creates your account/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Demo/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "My Profile" })).toBeNull();
  });

  it("says sign-in is unavailable when there is no backend, and offers no sign-in link", async () => {
    await menu(unavailableAuthService, "Account: sign in");
    expect(screen.getByText(/Sign-in isn’t available right now/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });
});

describe("account gate", () => {
  it("opens every account page for a backend customer", async () => {
    gate(withSession(backendSession));
    expect(await screen.findByText("Account page content")).toBeInTheDocument();
  });

  it("asks a guest with the backend to sign in, and returns them to the same page", async () => {
    gate(withSession(null));
    expect(await screen.findByRole("heading", { name: "Sign in to see your account" })).toBeInTheDocument();
    expect(screen.getByText(/Signing in gives you your profile, saved addresses, orders and wishlist/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to sign in" })).toHaveAttribute("href", "/login?next=%2Faccount%2Forders");
    expect(screen.queryByText("Account page content")).toBeNull();
  });

  it("says accounts are unavailable without the backend, and never shows the page", async () => {
    gate(unavailableAuthService);
    expect(await screen.findByRole("heading", { name: "Sign-in isn’t available right now" })).toBeInTheDocument();
    expect(screen.queryByText("Account page content")).toBeNull();
    expect(screen.queryByRole("button", { name: /Demo/ })).toBeNull();
  });
});
