import { apiBaseUrl, apiEndpoints } from "@/config/api";
import { createApiClient, type ApiClient } from "@/lib/api-client";

// The signed-in customer's profile on the backend. Only the name can be changed; email and phone are
// verified contacts and read-only here.

export interface AccountProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  /** E.164, such as +919876543210. */
  phone: string | null;
}

export interface ProfileService {
  get(): Promise<AccountProfile>;
  updateName(fullName: string): Promise<AccountProfile>;
}

export function createHttpProfileService(client: ApiClient): ProfileService {
  const { profile } = apiEndpoints.customer;
  return {
    get: () => client.request<AccountProfile>(profile),
    updateName: (fullName) => client.request<AccountProfile>(profile, { method: "PATCH", body: { full_name: fullName.trim() } }),
  };
}

export const accountProfileService: ProfileService | null = apiBaseUrl ? createHttpProfileService(createApiClient(apiBaseUrl)) : null;
