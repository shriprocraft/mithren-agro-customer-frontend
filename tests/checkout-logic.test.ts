// @vitest-environment node
import { describe, expect, it } from "vitest";
import { products } from "./fixtures/catalog/products";
import { cleanAddress, emptyAddress, formatAddressLine, isValidPincode, normalizeMobile, parseAddresses, validateAddress } from "@/lib/address";
import { addToCart, checkoutBlocker, clampQuantity, MAX_QUANTITY_PER_ITEM, parseCart, resolveLines, setCartQuantity, summarize } from "@/lib/cart";
import type { Address, AddressInput } from "@/types/order";

const valid: AddressInput = {
  full_name: "Asha Rao",
  mobile: "+91 98765 43210",
  house: "12B, Lake View Apartments",
  street: "MG Road, Indiranagar",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560038",
  landmark: "",
  type: "home",
};
const address: Address = { ...cleanAddress(valid), id: "addr-1" };
const tomatoes = products.find((p) => p.slug === "tomatoes")!;
const jowar = products.find((p) => p.slug === "jowar")!; // out of stock

describe("address validation", () => {
  it("accepts a complete address and normalises the mobile number", () => {
    expect(validateAddress(valid)).toEqual({});
    expect(cleanAddress(valid).mobile).toBe("9876543210");
    expect(cleanAddress(valid).landmark).toBeUndefined();
  });

  it("reports every missing required field", () => {
    const errors = validateAddress(emptyAddress);
    expect(Object.keys(errors).sort()).toEqual(["city", "full_name", "house", "mobile", "pincode", "state", "street"]);
  });

  it("validates Indian mobile numbers", () => {
    for (const ok of ["9876543210", "+91 98765 43210", "09876543210", "91-98765-43210"]) expect(normalizeMobile(ok)).toBe("9876543210");
    for (const bad of ["5876543210", "98765", "98765432101", "abcdefghij"]) expect(normalizeMobile(bad)).toBeNull();
    expect(validateAddress({ ...valid, mobile: "12345" }).mobile).toMatch(/10-digit/);
  });

  it("validates PIN codes and states", () => {
    expect(isValidPincode("560038")).toBe(true);
    for (const bad of ["056003", "56003", "5600381", "56A038"]) expect(isValidPincode(bad)).toBe(false);
    expect(validateAddress({ ...valid, state: "Atlantis" }).state).toBeDefined();
  });

  it("formats a one-line address and drops invalid stored entries", () => {
    expect(formatAddressLine(address)).toBe("12B, Lake View Apartments, MG Road, Indiranagar, Bengaluru, Karnataka 560038");
    expect(parseAddresses([address, { ...address, id: "x", pincode: "1" }, "junk"])).toEqual([address]);
    expect(parseAddresses("junk")).toBeNull();
  });
});

describe("cart quantities and totals", () => {
  it("adds a chosen quantity, caps it, and clamps edits", () => {
    expect(addToCart([], "p-1", 3).items).toEqual([{ product_id: "p-1", quantity: 3 }]);
    expect(addToCart([{ product_id: "p-1", quantity: 18 }], "p-1", 5).items[0]!.quantity).toBe(MAX_QUANTITY_PER_ITEM);
    expect(setCartQuantity([{ product_id: "p-1", quantity: 2 }], "p-1", 0)[0]!.quantity).toBe(1);
    expect(clampQuantity(99)).toBe(MAX_QUANTITY_PER_ITEM);
    expect(clampQuantity(Number.NaN)).toBe(1);
  });

  it("resolves lines against the catalogue and totals them", () => {
    const { lines, missing } = resolveLines([{ product_id: tomatoes.id, quantity: 3 }, { product_id: "gone", quantity: 1 }], products);
    expect(missing).toEqual(["gone"]);
    expect(lines[0]!.line_total).toBe(tomatoes.price * 3);
    expect(summarize(lines)).toMatchObject({ subtotal: tomatoes.price * 3, total: tomatoes.price * 3, count: 3 });
  });

  it("blocks checkout for an empty cart or out-of-stock items", () => {
    expect(checkoutBlocker([])).toMatch(/empty/);
    expect(checkoutBlocker(resolveLines([{ product_id: jowar.id, quantity: 1 }], products).lines)).toMatch(/out-of-stock/);
  });

  it("ignores malformed stored cart data", () => {
    expect(parseCart([{ product_id: "a", quantity: 2 }, { product_id: "b", quantity: -1 }, { quantity: 1 }, null])).toEqual([{ product_id: "a", quantity: 2 }]);
    expect(parseCart({})).toBeNull();
  });
});
