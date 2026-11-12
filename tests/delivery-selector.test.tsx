import { useEffect } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeliveryLocationSelector } from "@/components/layout/DeliveryLocationSelector";
import { AppProviders } from "@/context/AppProviders";
import { useAddressBook } from "@/context/AddressBookContext";
import { unavailableAuthService } from "@/services/auth/unavailable";
import { createHttpReverseGeocoder, unavailableReverseGeocoder, type ReverseGeocodingService } from "@/services/geocoding";
import { ApiError } from "@/lib/api-client";

let book: ReturnType<typeof useAddressBook>;
function Probe() {
  const value = useAddressBook();
  useEffect(() => {
    book = value;
  });
  return null;
}

const getCurrentPosition = vi.fn();
const watchPosition = vi.fn();

function open(geocoder: ReverseGeocodingService = unavailableReverseGeocoder) {
  render(<AppProviders authService={unavailableAuthService}><Probe /><DeliveryLocationSelector geocoder={geocoder} /></AppProviders>);
  fireEvent.click(screen.getByRole("button", { name: /Delivering to/ }));
}
const locateAt = (latitude: number, longitude: number) => getCurrentPosition.mockImplementation((ok) => ok({ coords: { latitude, longitude } }));
const failWith = (code: number) => getCurrentPosition.mockImplementation((_ok, fail) => fail({ code }));
const pressLocate = () => fireEvent.click(screen.getByRole("button", { name: "Use my current location" }));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  getCurrentPosition.mockReset();
  watchPosition.mockReset();
  vi.stubGlobal("navigator", Object.assign(Object.create(navigator), { geolocation: { getCurrentPosition, watchPosition } }));
  vi.stubGlobal("isSecureContext", true);
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }) as never;
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());

describe("delivery location selector", () => {
  it("prompts for a location and asks for permission only when pressed", () => {
    open();
    expect(screen.getAllByText(/Select your location/).length).toBeGreaterThan(0);
    expect(getCurrentPosition).not.toHaveBeenCalled();
    locateAt(13.06, 80.25);
    pressLocate();
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(watchPosition).not.toHaveBeenCalled();
  });

  it("shows a loading state while locating", () => {
    getCurrentPosition.mockImplementation(() => {});
    open();
    pressLocate();
    expect(screen.getByRole("button", { name: /Finding your location/ })).toBeDisabled();
  });

  it("with no lookup service, says the position was found but invents no address", async () => {
    locateAt(13.06, 80.25);
    open();
    pressLocate();
    expect(await screen.findByText(/Position detected, but no address/)).toBeInTheDocument();
    expect(screen.getByText(/Address lookup isn’t connected yet/)).toBeInTheDocument();
    expect(screen.queryByText(/We found this address/)).toBeNull();

    // The form starts empty apart from the position, and saving it keeps the coordinates.
    fireEvent.click(screen.getByRole("button", { name: "Enter my address" }));
    expect(screen.getByLabelText("Street and locality")).toHaveValue("");
    expect(screen.getByLabelText("City")).toHaveValue("");
    fillAddress();
    fireEvent.click(screen.getByRole("button", { name: "Save and deliver here" }));
    await waitFor(() => expect(book.addresses).toHaveLength(1));
    expect(book.addresses[0]).toMatchObject({ latitude: 13.06, longitude: 80.25 });
    expect(screen.getAllByText(/Home, 4B, Chennai/).length).toBeGreaterThan(0);
  });

  it("requires review of a looked-up address before anything is saved", async () => {
    locateAt(13.06, 80.25);
    const geocoder: ReverseGeocodingService = { reverse: async () => ({ status: "found", address: { formatted: "12 Anna Salai, Chennai", street: "12 Anna Salai", city: "Chennai", state: "Tamil Nadu", postal_code: "600002" } }) };
    open(geocoder);
    pressLocate();
    expect(await screen.findByText("12 Anna Salai, Chennai")).toBeInTheDocument();
    expect(book.addresses).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Review and confirm" }));
    expect(screen.getByLabelText("Street and locality")).toHaveValue("12 Anna Salai");
    expect(screen.getByLabelText("PIN code")).toHaveValue("600002");
    expect(book.addresses).toHaveLength(0);
  });

  it.each([
    [1, /permission was declined/],
    [2, /isn’t available right now/],
    [3, /took too long/],
  ])("explains failure code %i and offers a retry", async (code, message) => {
    failWith(code);
    open();
    pressLocate();
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    locateAt(13.06, 80.25);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText(/Position detected/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Detect my location again" })).toBeEnabled();
  });

  it("explains an unsupported browser", async () => {
    vi.stubGlobal("navigator", Object.create(null));
    render(<AppProviders authService={unavailableAuthService}><DeliveryLocationSelector geocoder={unavailableReverseGeocoder} /></AppProviders>);
    fireEvent.click(screen.getByRole("button", { name: /Delivering to/ }));
    pressLocate();
    expect(await screen.findByRole("alert")).toHaveTextContent(/can’t share your location/);
  });

  it("validates manual entry, then saves and activates the address", async () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Add address" }));
    fireEvent.click(screen.getByRole("button", { name: "Save and deliver here" }));
    expect(screen.getByText(/highlighted fields/)).toBeInTheDocument();
    expect(book.addresses).toHaveLength(0);
    fillAddress();
    fireEvent.click(screen.getByRole("button", { name: "Save and deliver here" }));
    await waitFor(() => expect(book.addresses).toHaveLength(1));
    expect(book.addresses[0]!.latitude).toBeUndefined();
    expect(screen.getAllByText(/Home, 4B, Chennai/).length).toBeGreaterThan(0);
  });

  it("switches between saved addresses and to a district", async () => {
    open();
    const input = { full_name: "Asha", mobile: "9876543210", street: "Main Road", state: "Tamil Nadu", landmark: "" };
    act(() => {
      book.add({ ...input, house: "1A", city: "Chennai", pincode: "600001", type: "home" });
      book.add({ ...input, house: "2B", city: "Madurai", pincode: "625001", type: "work" });
    });
    fireEvent.click(screen.getByRole("button", { name: /Work: Asha/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Delivering to/ })).toHaveTextContent("Work, 2B, Madurai"));
    fireEvent.click(screen.getByRole("button", { name: /Delivering to/ }));
    expect(screen.getByRole("button", { name: /Work: Asha/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /Home: Asha/ }));
    await waitFor(() => expect(screen.getAllByText(/Home, 1A, Chennai/).length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: /Delivering to/ }));
    fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Salem" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Delivering to/ })).toHaveTextContent("Salem"));
  });
});

function fillAddress() {
  const set = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
  set("Full name", "Asha Devi");
  set("Mobile number", "9876543210");
  set("House / flat / building", "4B");
  set("Street and locality", "Main Road");
  set("City", "Chennai");
  set("State", "Tamil Nadu");
  set("PIN code", "600001");
}

describe("reverse-geocoding service", () => {
  it("distinguishes a found address from every other outcome", async () => {
    await expect(unavailableReverseGeocoder.reverse({ latitude: 1, longitude: 2 })).resolves.toEqual({ status: "unavailable" });
    const address = { formatted: "X", street: null, city: null, state: null, postal_code: null };
    const request = vi.fn().mockResolvedValueOnce({ address }).mockResolvedValueOnce({ address: null }).mockRejectedValueOnce(new ApiError("timeout", "", null));
    const service = createHttpReverseGeocoder({ request });
    await expect(service.reverse({ latitude: 1, longitude: 2 })).resolves.toEqual({ status: "found", address });
    expect(request).toHaveBeenCalledWith("/geocoding/reverse", expect.objectContaining({ query: { lat: "1", lng: "2" } }));
    await expect(service.reverse({ latitude: 1, longitude: 2 })).resolves.toEqual({ status: "not_found" });
    await expect(service.reverse({ latitude: 1, longitude: 2 })).resolves.toEqual({ status: "error" });
  });

  it("reports a backend without a lookup service as unavailable, not as a failed lookup", async () => {
    const request = vi.fn()
      .mockRejectedValueOnce(new ApiError("unknown", "Not Found", 404))
      .mockRejectedValueOnce(new ApiError("service_unavailable", "", 503))
      .mockRejectedValueOnce(new ApiError("internal_error", "", 500));
    const service = createHttpReverseGeocoder({ request });
    await expect(service.reverse({ latitude: 1, longitude: 2 })).resolves.toEqual({ status: "unavailable" });
    await expect(service.reverse({ latitude: 1, longitude: 2 })).resolves.toEqual({ status: "unavailable" });
    await expect(service.reverse({ latitude: 1, longitude: 2 })).resolves.toEqual({ status: "error" });
  });
});
