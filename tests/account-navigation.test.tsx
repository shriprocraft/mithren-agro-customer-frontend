import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { AppProviders } from "@/context/AppProviders";
import { unavailableAuthService } from "@/services/auth/unavailable";
import type { AuthService, AuthSession } from "@/types/auth";

// The header menu and the /account gate for each kind of visitor: a guest (with and without the backend),
// a customer signed in through the backend, and the development mock.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/account/orders",
  useSearchParams: () => new URLSearchParams(),
}));

const backendSession: AuthSession = { source: "backend", customer: { id: "cust-1", full_name: "Asha Ramesh", email: null, phone: "+919876543210" } };
const mockSession: AuthSession = { source: "development_mock", customer: { id: "dev-mock-1", full_name: null, email: null, phone: "+919876543210" } };
const withSession = (session: AuthSession | null, mode: AuthService["mode"] = "backend"): AuthService => ({ ...unavailableAuthService, mode, getSession: async () => session });

const menu = async (service: AuthService, label: string | RegExp) => {
  render(<AppProviders authService={service}><AccountMenu /></AppProviders>);
  act(() => fireEvent.click(screen.getByRole("button", { name: /Account:/ })));
  return screen.findByRole("button", { name: label });
};

const gate = (service: AuthService, allowSignedIn = false) =>
  render(<AppProviders authService={service}><RequireDemoSession allowSignedIn={allowSignedIn}><p>Account page content</p></RequireDemoSession></AppProviders>);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("account menu", () => {
  it("for a backend customer: their name, Profile and Addresses links, Sign out, and no sample-data or preview wording", async () => {
    await menu(withSession(backendSession), "Account: signed in as Asha Ramesh");
    expect(screen.getByText("Asha Ramesh")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Profile" })).toHaveAttribute("href", "/account/profile");
    expect(screen.getByRole("link", { name: "My Addresses" })).toHaveAttribute("href", "/account/addresses");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.queryByText(/still sample data for now/)).toBeNull();
    expect(screen.queryByRole("link", { name: /Create an account/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });

  it("names a backend customer without a name by their number", async () => {
    await menu(withSession({ ...backendSession, customer: { ...backendSession.customer, full_name: null } }), "Account: signed in as +919876543210");
  });

  it("for a guest with the backend: sign in, and signing in creates the account (no preview link)", async () => {
    await menu(withSession(null), "Account: sign in");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: /Sign in with your mobile number to create an account/ })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: /Create an account \(preview\)/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "My Profile" })).toBeNull();
  });

  it("keeps the registration preview link when there is no backend", async () => {
    await menu(unavailableAuthService, "Account: sign in");
    expect(screen.getByRole("link", { name: /Create an account \(preview\)/ })).toHaveAttribute("href", "/register");
  });

  it("never offers the live account links to a development mock session", async () => {
    await menu(withSession(mockSession, "development_mock"), "Account: signed in as +919876543210");
    expect(screen.getByText(/Development sign-in, not a real account/)).toBeInTheDocument();
    expect(screen.getByText(/My Account shows sample data only/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My Profile" })).toBeNull();
  });
});

describe("account gate", () => {
  it("opens Profile and Addresses for a backend customer", async () => {
    gate(withSession(backendSession), true);
    expect(await screen.findByText("Account page content")).toBeInTheDocument();
  });

  it("keeps unfinished pages closed for a backend customer, says what is live, and links to it", async () => {
    gate(withSession(backendSession));
    expect(await screen.findByRole("heading", { name: "This part of My Account isn’t available yet" })).toBeInTheDocument();
    expect(screen.queryByText("Account page content")).toBeNull();
    expect(screen.getByText(/Your profile and saved addresses are live for your account/)).toBeInTheDocument();
    expect(screen.getByText(/Orders, wishlist, settings and order tracking here aren’t connected/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Profile" })).toHaveAttribute("href", "/account/profile");
    expect(screen.getByRole("link", { name: "My Addresses" })).toHaveAttribute("href", "/account/addresses");
    expect(screen.queryByRole("link", { name: "Go to sign in" })).toBeNull();
  });

  it("tells a guest with the backend what signing in gives them", async () => {
    gate(withSession(null));
    expect(await screen.findByRole("heading", { name: "Sign in to see your account" })).toBeInTheDocument();
    expect(screen.getByText(/Signing in gives you your profile and saved addresses/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to sign in" })).toHaveAttribute("href", "/login?next=%2Faccount%2Forders");
    expect(screen.queryByText("Account page content")).toBeNull();
  });

  it("doesn't claim anything is live without the backend, and never opens real-account pages for the mock", async () => {
    const { unmount } = gate(unavailableAuthService, true);
    expect(await screen.findByText(/Customer accounts aren’t connected on this site yet/)).toBeInTheDocument();
    unmount();
    gate(withSession(mockSession, "development_mock"), true);
    expect(await screen.findByText(/Customer accounts aren’t connected on this site yet/)).toBeInTheDocument();
    expect(screen.queryByText("Account page content")).toBeNull();
  });
});
