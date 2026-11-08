import { useEffect } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountProfileView } from "@/components/account/AccountProfileView";
import { AnnouncerProvider } from "@/context/AnnouncerContext";
import { AddressBookProvider, useAddressBook } from "@/context/AddressBookContext";
import { AuthProvider } from "@/context/AuthContext";
import { createApiClient, type ApiClient } from "@/lib/api-client";
import { createHttpAddressService, toAddressPayload, type AddressService } from "@/services/addresses";
import { unavailableAuthService } from "@/services/auth/unavailable";
import { createHttpProfileService, type ProfileService } from "@/services/profile";
import type { AuthService, AuthSession } from "@/types/auth";
import type { Address, AddressInput } from "@/types/order";

const input: AddressInput = {
  full_name: " Asha Rao ", mobile: "+91 98765-43210", house: "12B", street: "MG Road", city: "Bengaluru",
  state: "Karnataka", pincode: "560001", type: "home",
};
const saved = (id: string, extra: Partial<Address> = {}): Address => ({
  id, full_name: "Asha Rao", mobile: "9876543210", house: "12B", street: "MG Road", landmark: null, city: "Bengaluru",
  state: "Karnataka", pincode: "560001", type: "home", latitude: null, longitude: null, ...extra,
});
const session: AuthSession = { source: "backend", customer: { id: "c1", full_name: "Asha", email: "a@example.com", phone: null } };
const signedIn: AuthService = { ...unavailableAuthService, mode: "backend", getSession: async () => session };
const signedOut: AuthService = { ...unavailableAuthService, mode: "backend", getSession: async () => null };

function recordingClient(responses: Record<string, unknown> = {}) {
  const calls: { path: string; method: string; body: unknown }[] = [];
  const client: ApiClient = {
    request: async <T,>(path: string, options: { method?: string; body?: unknown } = {}) => {
      calls.push({ path, method: options.method ?? "GET", body: options.body });
      return responses[`${options.method ?? "GET"} ${path}`] as T;
    },
  };
  return { client, calls };
}

function fakeAddressService(initial: Address[] = [], defaultId: string | null = null) {
  let n = 0;
  return {
    list: vi.fn(async () => ({ addresses: initial, default_address_id: defaultId })),
    create: vi.fn(async () => saved(`new-${++n}`)),
    update: vi.fn(async (id: string) => saved(id, { city: "Mysuru" })),
    remove: vi.fn(async () => undefined),
    setDefault: vi.fn(async (id: string) => id),
  } satisfies AddressService;
}

type Book = ReturnType<typeof useAddressBook>;
const capture: { book?: Book } = {};
function Probe() {
  const value = useAddressBook();
  useEffect(() => {
    capture.book = value;
  });
  return null;
}
// Always the latest rendered value, read lazily.
const book = new Proxy({} as Book, { get: (_target, key) => Reflect.get(capture.book!, key) });
function renderBook(auth: AuthService, service: AddressService) {
  render(
    <AuthProvider service={auth}>
      <AddressBookProvider service={service}><Probe /></AddressBookProvider>
    </AuthProvider>,
  );
}

beforeEach(() => localStorage.clear());

describe("address API adapter", () => {
  it("sends a cleaned address with explicit nulls, so an edit can clear optional fields", () => {
    expect(toAddressPayload({ ...input, landmark: "  " })).toEqual({
      full_name: "Asha Rao", mobile: "9876543210", house: "12B", street: "MG Road", landmark: null, city: "Bengaluru",
      state: "Karnataka", pincode: "560001", type: "home", latitude: null, longitude: null,
    });
  });

  it("uses the customer endpoints with the approved methods and never sends a customer id", async () => {
    const { client, calls } = recordingClient({ "PATCH /customer/addresses/a%2Fb/default": { default_address_id: "a/b" } });
    const service = createHttpAddressService(client);
    await service.list();
    await service.create(input);
    await service.update("a/b", input);
    await service.remove("a/b");
    expect(await service.setDefault("a/b")).toBe("a/b");

    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      "GET /customer/addresses",
      "POST /customer/addresses",
      "PATCH /customer/addresses/a%2Fb",
      "DELETE /customer/addresses/a%2Fb",
      "PATCH /customer/addresses/a%2Fb/default",
    ]);
    expect(JSON.stringify(calls)).not.toContain("customer_id");
  });

  it("the HTTP client sends PATCH and DELETE with credentials", async () => {
    const fetchImpl = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => new Response(null, { status: 204 }));
    const client = createApiClient("https://api.example.com/api/v1", fetchImpl as unknown as typeof fetch);
    await client.request("/customer/addresses/x", { method: "DELETE" });
    await client.request("/customer/profile", { method: "PATCH", body: { full_name: "Asha" } });

    expect(fetchImpl.mock.calls.map(([url, init]) => [url, init?.method, init?.credentials])).toEqual([
      ["https://api.example.com/api/v1/customer/addresses/x", "DELETE", "include"],
      ["https://api.example.com/api/v1/customer/profile", "PATCH", "include"],
    ]);
  });

  it("the profile adapter reads and renames through /customer/profile", async () => {
    const { client, calls } = recordingClient();
    const service = createHttpProfileService(client);
    await service.get();
    await service.updateName("  Asha R ");

    expect(calls).toEqual([
      { path: "/customer/profile", method: "GET", body: undefined },
      { path: "/customer/profile", method: "PATCH", body: { full_name: "Asha R" } },
    ]);
  });
});

describe("address book storage", () => {
  it("a signed-in customer sees their account's addresses, and browser addresses are left untouched", async () => {
    const guestAddress = saved("addr-guest", { city: "Chennai" });
    localStorage.setItem("mithren.addresses", JSON.stringify([guestAddress]));
    const service = fakeAddressService([saved("acc-1")], "acc-1");
    renderBook(signedIn, service);

    await waitFor(() => expect(book.hydrated).toBe(true));
    expect(book.storage).toBe("account");
    expect(book.addresses.map((a) => a.id)).toEqual(["acc-1"]);
    expect(book.defaultId).toBe("acc-1");
    // Nothing was uploaded or deleted when the customer signed in.
    expect(service.create).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("mithren.addresses")!)).toEqual([guestAddress]);
  });

  it("account changes go to the API; the first address becomes the default and deleting it leaves none", async () => {
    const service = fakeAddressService();
    renderBook(signedIn, service);
    await waitFor(() => expect(book.hydrated).toBe(true));

    let result: Awaited<ReturnType<typeof book.add>> | undefined;
    await act(async () => { result = await book.add(input); });
    expect(result).toEqual({ address: saved("new-1"), saved: true });
    expect(book.defaultId).toBe("new-1");

    await act(async () => { await book.add(input); });
    expect(book.defaultId).toBe("new-1");
    await act(async () => { await book.setDefault("new-2"); });
    expect(service.setDefault).toHaveBeenCalledWith("new-2");
    expect(book.defaultId).toBe("new-2");

    await act(async () => { await book.update("new-1", input); });
    expect(book.addresses.find((a) => a.id === "new-1")?.city).toBe("Mysuru");

    await act(async () => { await book.remove("new-2"); });
    expect(service.remove).toHaveBeenCalledWith("new-2");
    expect(book.defaultId).toBeNull();
    expect(localStorage.getItem("mithren.addresses")).toBeNull();
  });

  it("a failed account save reports not saved and changes nothing", async () => {
    const service = { ...fakeAddressService(), create: vi.fn(async () => { throw new Error("offline"); }) };
    renderBook(signedIn, service);
    await waitFor(() => expect(book.hydrated).toBe(true));

    let result: Awaited<ReturnType<typeof book.add>> | undefined;
    await act(async () => { result = await book.add(input); });

    expect(result).toEqual({ address: null, saved: false });
    expect(book.addresses).toEqual([]);
  });

  it("guests keep using browser storage and never call the API", async () => {
    const service = fakeAddressService();
    renderBook(signedOut, service);
    await waitFor(() => expect(book.hydrated).toBe(true));

    await act(async () => { await book.add(input); });

    expect(book.storage).toBe("browser");
    expect(service.list).not.toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("mithren.addresses")!)).toHaveLength(1);
  });

  it("demo sample addresses stay in browser storage even for a signed-in customer", async () => {
    const service = fakeAddressService();
    renderBook(signedIn, service);
    await waitFor(() => expect(book.hydrated).toBe(true));

    act(() => { book.addSample(input); });

    expect(service.create).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("mithren.addresses")!)[0]).toMatchObject({ is_sample: true });
  });
});

describe("account profile view", () => {
  const profile = { id: "c1", full_name: "Asha Rao", email: "asha@example.com", phone: "+919876543210" };

  it("shows the verified contacts read-only and saves only the name", async () => {
    const service = {
      get: vi.fn(async () => profile),
      updateName: vi.fn(async (name: string) => ({ ...profile, full_name: name.trim() })),
    } satisfies ProfileService;
    render(<AnnouncerProvider><AccountProfileView service={service} /></AnnouncerProvider>);

    expect(await screen.findByText("asha@example.com")).toBeInTheDocument();
    expect(screen.getByText("+919876543210")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /edit name/i }));
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Asha R" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/saved to your account/i)).toBeInTheDocument();
    expect(service.updateName).toHaveBeenCalledWith("Asha R");
    expect(screen.getByText("Asha R")).toBeInTheDocument();
  });

  it("refuses a one-letter name without calling the API", async () => {
    const service = { get: vi.fn(async () => profile), updateName: vi.fn() } satisfies ProfileService;
    render(<AnnouncerProvider><AccountProfileView service={service} /></AnnouncerProvider>);

    fireEvent.click(await screen.findByRole("button", { name: /edit name/i }));
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
    expect(service.updateName).not.toHaveBeenCalled();
  });
});
