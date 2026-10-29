import { tamilNaduDistricts, type District } from "@/data/tamil-nadu-districts";

// Delivery location: the customer's Tamil Nadu district, saved in this browser. Choosing a district
// records where the customer wants delivery; it does not mean delivery is available there, because
// no serviceability rules are configured yet (docs/REQUIREMENTS_REGISTER.md). Coordinates from
// "Use my current location" are used once to suggest a district and are never stored.

export const DELIVERY_LOCATION_KEY = "mithren.delivery-location";

export interface DeliveryLocation {
  district: string;
  /** How it was chosen: from the list, or by confirming the suggestion from the device location. */
  source: "list" | "device";
}

/** Validates stored data (browser storage is untrusted): only a known district name is accepted. */
export function parseDeliveryLocation(value: unknown): DeliveryLocation | null {
  if (typeof value !== "object" || value === null) return null;
  const { district, source } = value as Partial<DeliveryLocation>;
  if (typeof district !== "string" || !tamilNaduDistricts.some((d) => d.name === district)) return null;
  return { district, source: source === "device" ? "device" : "list" };
}

const normalise = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[^a-z]/g, "");

/** Districts whose name contains the query (ignoring case, spaces and punctuation); names that start with it first. */
export function searchDistricts(query: string, districts: District[] = tamilNaduDistricts): District[] {
  const needle = normalise(query);
  if (!needle) return districts;
  const matches = districts.filter((d) => normalise(d.name).includes(needle));
  return [...matches.filter((d) => normalise(d.name).startsWith(needle)), ...matches.filter((d) => !normalise(d.name).startsWith(needle))];
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Beyond this distance from every district headquarters, no district is suggested. */
export const MAX_SUGGESTION_KM = 60;

/**
 * The district whose headquarters is nearest to a point, or null when none is within
 * MAX_SUGGESTION_KM (for example, outside Tamil Nadu). A suggestion only: the customer confirms it.
 */
export function nearestDistrict(point: { lat: number; lng: number }, districts: District[] = tamilNaduDistricts): District | null {
  let best: { district: District; km: number } | null = null;
  for (const district of districts) {
    const km = distanceKm(point, district.hq);
    if (!best || km < best.km) best = { district, km };
  }
  return best && best.km <= MAX_SUGGESTION_KM ? best.district : null;
}

/** GeolocationPositionError codes: 1 permission denied, 2 position unavailable, 3 timeout. */
export function geolocationErrorMessage(code: number | "unsupported" | "insecure"): string {
  switch (code) {
    case "unsupported":
      return "This browser can’t share your location. Please choose your district from the list.";
    case "insecure":
      return "Location sharing needs a secure (https) connection. Please choose your district from the list.";
    case 1:
      return "Location permission was declined. You can allow it in your browser settings, or choose your district from the list.";
    case 3:
      return "Finding your location took too long. Try again, or choose your district from the list.";
    default:
      return "Your location isn’t available right now. Please choose your district from the list.";
  }
}

/** What we can honestly say about delivery to a district today. */
export function serviceabilityNote(district: string): string {
  return `Delivery coverage for ${district} hasn’t been confirmed yet. We’ll use this district when delivery areas are set up.`;
}
