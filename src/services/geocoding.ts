import { apiBaseUrl, apiEndpoints } from "@/config/api";
import { createApiClient, type ApiClient } from "@/lib/api-client";

// Turning coordinates into a readable address. The provider sits behind the backend, so its key never
// reaches the browser and it can be replaced without touching the UI (docs/BACKEND_CONTRACTS.md). The
// result says exactly what happened, so "no lookup service" can never be shown as a found address.

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodedAddress {
  /** The provider's full address line. */
  formatted: string;
  street: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
}

export type ReverseGeocodeResult =
  | { status: "found"; address: GeocodedAddress }
  | { status: "not_found" }
  | { status: "unavailable" }
  | { status: "error" };

export interface ReverseGeocodingService {
  reverse(coordinates: Coordinates): Promise<ReverseGeocodeResult>;
}

export const unavailableReverseGeocoder: ReverseGeocodingService = {
  reverse: async () => ({ status: "unavailable" }),
};

export function createHttpReverseGeocoder(client: ApiClient): ReverseGeocodingService {
  return {
    async reverse({ latitude, longitude }) {
      try {
        const response = await client.request<{ address: GeocodedAddress | null }>(apiEndpoints.geocoding.reverse, {
          query: { lat: String(latitude), lng: String(longitude) },
          timeoutMs: 10_000,
        });
        return response?.address?.formatted ? { status: "found", address: response.address } : { status: "not_found" };
      } catch {
        return { status: "error" };
      }
    },
  };
}

export const reverseGeocoder: ReverseGeocodingService = apiBaseUrl ? createHttpReverseGeocoder(createApiClient(apiBaseUrl)) : unavailableReverseGeocoder;
