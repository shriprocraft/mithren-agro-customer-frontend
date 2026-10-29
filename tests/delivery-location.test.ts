// @vitest-environment node
import { describe, expect, it } from "vitest";
import { tamilNaduDistricts } from "@/data/tamil-nadu-districts";
import { geolocationErrorMessage, nearestDistrict, parseDeliveryLocation, searchDistricts, serviceabilityNote } from "@/lib/delivery-location";

describe("delivery location", () => {
  it("lists all 38 Tamil Nadu districts, alphabetically and without duplicates", () => {
    const names = tamilNaduDistricts.map((d) => d.name);
    expect(names).toHaveLength(38);
    expect(new Set(names).size).toBe(38);
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
    expect(names).toEqual(expect.arrayContaining(["Ariyalur", "Chennai", "Kanniyakumari", "Mayiladuthurai", "Tirupathur", "Virudhunagar"]));
  });

  it("searches by name, ignoring case and spaces, with prefix matches first", () => {
    expect(searchDistricts("").length).toBe(38);
    expect(searchDistricts("CHENN").map((d) => d.name)).toEqual(["Chennai"]);
    expect(searchDistricts("tiru").map((d) => d.name).slice(0, 2)).toEqual(["Tiruchirappalli", "Tirunelveli"]);
    expect(searchDistricts("puram").map((d) => d.name)).toEqual(expect.arrayContaining(["Kancheepuram", "Ramanathapuram", "Viluppuram"]));
    expect(searchDistricts("zzz")).toEqual([]);
  });

  it("accepts only known districts from storage", () => {
    expect(parseDeliveryLocation({ district: "Madurai", source: "list" })).toEqual({ district: "Madurai", source: "list" });
    expect(parseDeliveryLocation({ district: "Madurai", source: "evil" })).toEqual({ district: "Madurai", source: "list" });
    expect(parseDeliveryLocation({ district: "Bengaluru" })).toBeNull();
    expect(parseDeliveryLocation("Madurai")).toBeNull();
    expect(parseDeliveryLocation(null)).toBeNull();
  });

  it("suggests the nearest district headquarters, and nothing far outside Tamil Nadu", () => {
    expect(nearestDistrict({ lat: 13.06, lng: 80.25 })?.name).toBe("Chennai");
    expect(nearestDistrict({ lat: 11.0, lng: 76.95 })?.name).toBe("Coimbatore");
    expect(nearestDistrict({ lat: 28.61, lng: 77.21 })).toBeNull(); // New Delhi
  });

  it("explains each geolocation failure and never promises delivery", () => {
    for (const code of [1, 2, 3, "unsupported", "insecure"] as const) expect(geolocationErrorMessage(code)).toMatch(/district/);
    expect(serviceabilityNote("Salem")).toMatch(/hasn’t been confirmed/);
  });
});
