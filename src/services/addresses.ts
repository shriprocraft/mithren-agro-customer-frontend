import { apiBaseUrl, apiEndpoints } from "@/config/api";
import { createApiClient, type ApiClient } from "@/lib/api-client";
import { cleanAddress } from "@/lib/address";
import type { Address, AddressInput } from "@/types/order";

// The signed-in customer's address book on the backend (docs/BACKEND_CONTRACTS.md, "Addresses").
// The customer is identified by the session cookie only; no customer id is ever sent.

export interface AddressList {
  addresses: Address[];
  default_address_id: string | null;
}

export interface AddressService {
  list(): Promise<AddressList>;
  create(input: AddressInput): Promise<Address>;
  update(id: string, input: AddressInput): Promise<Address>;
  remove(id: string): Promise<void>;
  setDefault(id: string): Promise<string>;
}

/**
 * The request body for a create or a full edit. Absent optional fields are sent as null, so editing an
 * address can clear its landmark or coordinates (the API treats an omitted field as "unchanged").
 */
export function toAddressPayload(input: AddressInput) {
  const clean = cleanAddress(input);
  return {
    full_name: clean.full_name,
    mobile: clean.mobile,
    house: clean.house,
    street: clean.street,
    landmark: clean.landmark ?? null,
    city: clean.city,
    state: clean.state,
    pincode: clean.pincode,
    type: clean.type,
    latitude: clean.latitude ?? null,
    longitude: clean.longitude ?? null,
  };
}

export function createHttpAddressService(client: ApiClient): AddressService {
  const { customer } = apiEndpoints;
  return {
    list: () => client.request<AddressList>(customer.addresses),
    create: (input) => client.request<Address>(customer.addresses, { method: "POST", body: toAddressPayload(input) }),
    update: (id, input) => client.request<Address>(customer.address(id), { method: "PATCH", body: toAddressPayload(input) }),
    remove: (id) => client.request<void>(customer.address(id), { method: "DELETE" }),
    setDefault: async (id) =>
      (await client.request<{ default_address_id: string }>(customer.defaultAddress(id), { method: "PATCH" })).default_address_id,
  };
}

/** Null when no backend is configured; the address book then stays in browser storage. */
export const accountAddressService: AddressService | null = apiBaseUrl ? createHttpAddressService(createApiClient(apiBaseUrl)) : null;
