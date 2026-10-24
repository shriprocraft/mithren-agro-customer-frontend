import { indianStates } from "@/data/indian-states";
import { addressTypes, type Address, type AddressInput, type AddressType } from "@/types/order";

export type AddressErrors = Partial<Record<keyof AddressInput, string>>;

export const addressTypeLabels: Record<AddressType, string> = { home: "Home", work: "Work", other: "Other" };

export const emptyAddress: AddressInput = {
  full_name: "",
  mobile: "",
  house: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  type: "home",
};

/**
 * Indian mobile numbers: 10 digits starting 6–9. Accepts the common ways people type them
 * (+91, 91, a leading 0, spaces and dashes) and returns the bare 10 digits, or null.
 */
export function normalizeMobile(value: string): string | null {
  const digits = value.replace(/[\s-]/g, "").replace(/^\+?91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** Indian PIN codes: 6 digits, first digit 1–9. */
export function isValidPincode(value: string): boolean {
  return /^[1-9]\d{5}$/.test(value.trim());
}

const required: { field: keyof AddressInput; label: string }[] = [
  { field: "full_name", label: "Enter the full name" },
  { field: "mobile", label: "Enter a mobile number" },
  { field: "house", label: "Enter the house or flat number" },
  { field: "street", label: "Enter the street and locality" },
  { field: "city", label: "Enter the city" },
  { field: "state", label: "Choose a state" },
  { field: "pincode", label: "Enter the PIN code" },
];

/** Returns one message per invalid field; an empty object means the address is valid. */
export function validateAddress(input: AddressInput): AddressErrors {
  const errors: AddressErrors = {};
  for (const { field, label } of required) {
    if (!String(input[field] ?? "").trim()) errors[field] = label;
  }
  if (!errors.full_name && input.full_name.trim().length < 2) errors.full_name = "Enter at least 2 characters";
  if (!errors.mobile && !normalizeMobile(input.mobile)) {
    errors.mobile = "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9";
  }
  if (!errors.pincode && !isValidPincode(input.pincode)) errors.pincode = "Enter a valid 6-digit PIN code";
  if (!errors.state && !indianStates.includes(input.state)) errors.state = "Choose a state from the list";
  if (!addressTypes.includes(input.type)) errors.type = "Choose Home, Work or Other";
  return errors;
}

export function isValidAddress(input: AddressInput): boolean {
  return Object.keys(validateAddress(input)).length === 0;
}

/** Trims every field and stores the mobile number as bare digits. Call only on a valid address. */
export function cleanAddress(input: AddressInput): AddressInput {
  return {
    full_name: input.full_name.trim(),
    mobile: normalizeMobile(input.mobile) ?? input.mobile.trim(),
    house: input.house.trim(),
    street: input.street.trim(),
    city: input.city.trim(),
    state: input.state,
    pincode: input.pincode.trim(),
    landmark: input.landmark?.trim() || undefined,
    type: input.type,
  };
}

/** One line for summaries: "12B, MG Road, Near the park, Bengaluru, Karnataka 560001". */
export function formatAddressLine(address: Pick<Address, "house" | "street" | "landmark" | "city" | "state" | "pincode">): string {
  return [address.house, address.street, address.landmark, address.city, `${address.state} ${address.pincode}`]
    .filter(Boolean)
    .join(", ");
}

/** Validates stored address-book data (from browser storage, so untrusted). Drops invalid entries. */
export function parseAddresses(value: unknown): Address[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (a): a is Address =>
      typeof a === "object" && a !== null && typeof (a as Address).id === "string" && isValidAddress(a as Address),
  );
}
