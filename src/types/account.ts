import type { Address, AddressInput, Order } from "@/types/order";

// Customer account models for the DEMO account (docs/DEMO_ACCOUNT.md). snake_case so they can map to
// an API response later. Nothing here is authentication: there are no credentials of any kind.

/** The editable demo profile. Only what an order needs to address the customer. */
export interface CustomerProfile {
  full_name: string;
  email: string;
  /** 10-digit Indian mobile number without +91; optional. */
  mobile: string;
}

/**
 * The demo session marker kept in browser storage. It holds no identity, token or secret, only the
 * fact that the visitor chose to explore the demo account and when. Never treat it as proof of login.
 */
export interface DemoSession {
  kind: "demo";
  /** ISO timestamp. */
  started_at: string;
}

/** Local demo preferences. Nothing is sent anywhere; they only change what this browser shows. */
export interface AccountPreferences {
  order_updates: boolean;
  offers: boolean;
}

/**
 * What a real account backend will provide. Not implemented in this phase (no fake calls): the demo
 * context (context/DemoAccountContext.tsx) stands in for it. A real implementation must authenticate
 * on the server and authorise every call for the signed-in customer.
 */
export interface CustomerAccountService {
  signIn(credentials: unknown): Promise<void>;
  register(details: Omit<CustomerProfile, "mobile"> & { mobile?: string }): Promise<void>;
  signOut(): Promise<void>;
  getProfile(): Promise<CustomerProfile>;
  updateProfile(profile: CustomerProfile): Promise<CustomerProfile>;
  getOrders(): Promise<Order[]>;
  getAddresses(): Promise<Address[]>;
  saveAddress(address: AddressInput & { id?: string }): Promise<Address>;
}
