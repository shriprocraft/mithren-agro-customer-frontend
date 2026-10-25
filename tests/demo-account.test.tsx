import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountShell } from "@/components/account/AccountShell";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { RegisterView } from "@/components/account/RegisterView";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { AppProviders } from "@/context/AppProviders";
import { useAddressBook } from "@/context/AddressBookContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useOrders } from "@/context/OrdersContext";
import { bundles } from "@/data/bundles";
import { demoAddress } from "@/data/demo-account";
import { products } from "@/data/products";
import {
  buildSampleOrders,
  parsePreferences,
  parseProfile,
  parseSession,
  safeNextPath,
  validateProfile,
  validateRegistration,
} from "@/lib/demo-account";
import { parseOrders } from "@/lib/orders";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: push, back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/account/orders",
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  push.mockClear();
});

describe("demo account helpers", () => {
  it("validates the profile: name and email required, mobile optional but Indian", () => {
    expect(validateProfile({ full_name: "Asha Rao", email: "asha@example.com", mobile: "" })).toEqual({});
    expect(Object.keys(validateProfile({ full_name: "A", email: "not-an-email", mobile: "12345" }))).toEqual(["full_name", "email", "mobile"]);
    expect(validateProfile({ full_name: "", email: "", mobile: "+91 98765 43210" })).toMatchObject({ full_name: "Enter your full name", email: "Enter an email address" });
  });

  it("requires the preview acknowledgement on registration", () => {
    expect(validateRegistration({ full_name: "Asha Rao", email: "asha@example.com", mobile: "", acknowledged: false }).acknowledged).toBeTruthy();
    expect(validateRegistration({ full_name: "Asha Rao", email: "asha@example.com", mobile: "", acknowledged: true })).toEqual({});
  });

  it("only allows same-site destinations after sign-in, never the sign-in pages", () => {
    expect(safeNextPath("/account/orders")).toBe("/account/orders");
    expect(safeNextPath("https://evil.example")).toBe("/account");
    expect(safeNextPath("//evil.example")).toBe("/account");
    expect(safeNextPath("/\\evil.example")).toBe("/account");
    expect(safeNextPath("/login?next=/account")).toBe("/account");
    expect(safeNextPath(null)).toBe("/account");
  });

  it("treats stored values as untrusted", () => {
    expect(parseSession({ kind: "demo", started_at: "2026-10-25T10:00:00.000Z", token: "x" })).toEqual({ kind: "demo", started_at: "2026-10-25T10:00:00.000Z" });
    expect(parseSession({ kind: "admin", started_at: "2026-10-25T10:00:00.000Z" })).toBeNull();
    expect(parseSession({ kind: "demo", started_at: "yesterday" })).toBeNull();
    expect(parseProfile({ full_name: "X", email: "bad", mobile: "" })).toBeNull();
    expect(parsePreferences({ order_updates: "yes", offers: false })).toBeNull();
  });

  it("builds valid sample orders that end at each planned status and are flagged as samples", () => {
    const address = { ...demoAddress, id: "addr-sample-1", is_sample: true };
    const now = new Date("2026-10-25T12:00:00.000Z");
    const orders = buildSampleOrders([...products, ...bundles], address, now, new Set());
    expect(orders.map((o) => o.status)).toEqual(["order_confirmed", "out_for_delivery", "delivered"]);
    expect(orders.every((o) => o.is_sample)).toBe(true);
    expect(new Set(orders.map((o) => o.id)).size).toBe(3);
    expect(parseOrders(orders)).toHaveLength(3); // consistent totals, histories and address
    expect(orders.every((o) => o.history.every((e) => Date.parse(e.at) <= now.getTime()))).toBe(true);
  });
});

function Probe() {
  const account = useDemoAccount();
  const { orders } = useOrders();
  const book = useAddressBook();
  return (
    <div>
      <p data-testid="state">{account.isActive ? "active" : "inactive"}</p>
      <p data-testid="orders">{orders.filter((o) => o.is_sample).length}/{orders.length}</p>
      <p data-testid="addresses">{book.addresses.map((a) => `${a.full_name}${a.id === book.defaultId ? "*" : ""}`).join(",")}</p>
      <button onClick={account.startDemoSession}>start</button>
      <button onClick={account.endDemoSession}>end</button>
      <button onClick={() => book.add({ ...demoAddress, full_name: "Ravi Kumar" })}>add own</button>
    </div>
  );
}

describe("demo session", () => {
  it("adds sample orders and a default sample address, and removes only those when it ends", () => {
    render(<AppProviders><Probe /></AppProviders>);
    expect(screen.getByTestId("state")).toHaveTextContent("inactive");
    act(() => fireEvent.click(screen.getByText("start")));
    expect(screen.getByTestId("state")).toHaveTextContent("active");
    expect(screen.getByTestId("orders")).toHaveTextContent("3/3");
    expect(screen.getByTestId("addresses")).toHaveTextContent("Demo Customer*");
    expect(JSON.parse(localStorage.getItem("mithren.demo-session")!)).toEqual({ kind: "demo", started_at: expect.any(String) });

    act(() => fireEvent.click(screen.getByText("add own")));
    act(() => fireEvent.click(screen.getByText("end")));
    expect(screen.getByTestId("state")).toHaveTextContent("inactive");
    expect(screen.getByTestId("orders")).toHaveTextContent("0/0");
    expect(screen.getByTestId("addresses")).toHaveTextContent(/^Ravi Kumar$/);
  });

  it("stores no password or token anywhere", () => {
    render(<AppProviders><Probe /></AppProviders>);
    act(() => fireEvent.click(screen.getByText("start")));
    const everything = Object.keys(localStorage).map((k) => `${k}=${localStorage.getItem(k)}`).join("\n").toLowerCase();
    expect(everything).not.toMatch(/password|token|secret/);
  });
});

describe("account gate and header menu", () => {
  it("shows a demo entry screen instead of account pages without a session", () => {
    render(<AppProviders><AccountShell><RequireDemoSession><p>Secret account content</p></RequireDemoSession></AccountShell></AppProviders>);
    expect(screen.getByRole("heading", { name: "Sign in to see your account" })).toBeInTheDocument();
    expect(screen.queryByText("Secret account content")).toBeNull();
    expect(screen.getByRole("link", { name: "Go to sign in" })).toHaveAttribute("href", "/login?next=%2Faccount%2Forders");
    act(() => fireEvent.click(screen.getByRole("button", { name: /Explore Demo Account/ })));
    expect(screen.getByText("Secret account content")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Account" })).toBeInTheDocument();
  });

  it("offers sign-in when signed out and account links plus Logout in a demo session", () => {
    render(<AppProviders><AccountMenu /></AppProviders>);
    act(() => fireEvent.click(screen.getByRole("button", { name: "Account: sign in" })));
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    act(() => fireEvent.click(screen.getByRole("link", { name: "Explore Demo Account" })));

    act(() => fireEvent.click(screen.getByRole("button", { name: "Account: Demo Customer (demo)" })));
    for (const [name, href] of [["My Account", "/account"], ["My Orders", "/account/orders"], ["My Addresses", "/account/addresses"], ["My Wishlist", "/account/wishlist"]]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    act(() => fireEvent.click(screen.getByRole("button", { name: "Logout" })));
    expect(push).toHaveBeenCalledWith("/login?signed_out=1");
    expect(localStorage.getItem("mithren.demo-session")).toBe("null");
  });
});

describe("registration preview", () => {
  it("validates, then says no account was created and keeps nothing", () => {
    render(<AppProviders><RegisterView /></AppProviders>);
    act(() => fireEvent.click(screen.getByRole("button", { name: "Create account (preview)" })));
    expect(screen.getByRole("alert")).toHaveTextContent("Please fix the 3 highlighted fields");
    expect(screen.getByLabelText("Email address")).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Asha Rao" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "asha@example.com" } });
    fireEvent.click(screen.getByRole("checkbox"));
    act(() => fireEvent.click(screen.getByRole("button", { name: "Create account (preview)" })));
    expect(screen.getByText("no account was created")).toBeInTheDocument();
    expect(JSON.stringify({ ...localStorage })).not.toContain("asha@example.com");
  });
});
