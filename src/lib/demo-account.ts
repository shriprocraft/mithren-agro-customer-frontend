import { demoOrderTemplates } from "@/data/demo-account";
import { normalizeMobile } from "@/lib/address";
import { resolveLines } from "@/lib/cart";
import { advanceOrder, buildOrder, generateOrderId } from "@/lib/orders";
import type { AccountPreferences, CustomerProfile, DemoSession } from "@/types/account";
import type { Product } from "@/types/catalog";
import type { Address, Order } from "@/types/order";

// Pure helpers for the demo account: validation, parsing of stored values and sample orders.
// Demo account only (docs/DEMO_ACCOUNT.md); nothing here authenticates anyone.

export type ProfileErrors = Partial<Record<keyof CustomerProfile, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

/** Name and email are required; the mobile number is optional but must be a valid Indian number. */
export function validateProfile(profile: CustomerProfile): ProfileErrors {
  const errors: ProfileErrors = {};
  if (profile.full_name.trim().length < 2) errors.full_name = profile.full_name.trim() ? "Enter at least 2 characters" : "Enter your full name";
  if (!profile.email.trim()) errors.email = "Enter an email address";
  else if (!isValidEmail(profile.email)) errors.email = "Enter an email address like name@example.com";
  if (profile.mobile.trim() && !normalizeMobile(profile.mobile)) {
    errors.mobile = "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9";
  }
  return errors;
}

export function cleanProfile(profile: CustomerProfile): CustomerProfile {
  return {
    full_name: profile.full_name.trim(),
    email: profile.email.trim().toLowerCase(),
    mobile: profile.mobile.trim() ? (normalizeMobile(profile.mobile) ?? profile.mobile.trim()) : "",
  };
}

export interface RegistrationInput extends CustomerProfile {
  acknowledged: boolean;
}

export type RegistrationErrors = ProfileErrors & { acknowledged?: string };

export function validateRegistration(input: RegistrationInput): RegistrationErrors {
  const errors: RegistrationErrors = validateProfile(input);
  if (!input.acknowledged) errors.acknowledged = "Confirm that you understand this is a preview";
  return errors;
}

// Stored values are untrusted (browser storage); each parser returns null to fall back to the default.
export function parseSession(value: unknown): DemoSession | null {
  const s = value as DemoSession | null;
  return s && s.kind === "demo" && typeof s.started_at === "string" && !Number.isNaN(Date.parse(s.started_at)) ? { kind: "demo", started_at: s.started_at } : null;
}

export function parseProfile(value: unknown): CustomerProfile | null {
  const p = value as CustomerProfile | null;
  if (!p || typeof p !== "object" || typeof p.full_name !== "string" || typeof p.email !== "string" || typeof p.mobile !== "string") return null;
  return Object.keys(validateProfile(p)).length === 0 ? { full_name: p.full_name, email: p.email, mobile: p.mobile } : null;
}

export function parsePreferences(value: unknown): AccountPreferences | null {
  const p = value as AccountPreferences | null;
  return p && typeof p.order_updates === "boolean" && typeof p.offers === "boolean" ? { order_updates: p.order_updates, offers: p.offers } : null;
}

/**
 * Only same-site paths are allowed as a post-sign-in destination ("/account/orders"), never another
 * origin ("//evil.example", "https://…") or the sign-in pages themselves (which would loop).
 */
export function safeNextPath(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/^\/(login|register)(\/|\?|$)/.test(next)) return fallback;
  return next;
}

const HOUR = 3_600_000;

/**
 * Builds the illustrative orders shown in the demo account, with tracking histories that end at each
 * template's status. They go through the same buildOrder() as real checkout orders, so they are valid
 * and consistent, and they are flagged is_sample so the UI labels them and the demo can remove them.
 */
export function buildSampleOrders(catalog: Product[], address: Address, now: Date, taken: Set<string>): Order[] {
  const ids = new Set(taken);
  return demoOrderTemplates.map((template) => {
    const placedAt = new Date(now.getTime() - template.daysAgo * 24 * HOUR);
    const { lines } = resolveLines(template.items, catalog);
    // Sample orders ignore stock status: they describe the past, not something being bought now.
    const id = generateOrderId(placedAt, ids);
    ids.add(id);
    let order = buildOrder(lines.map((line) => ({ ...line, issue: undefined })), address, id, placedAt);
    let at = placedAt.getTime();
    const step = Math.max(0.25, Math.min(6, (now.getTime() - at) / HOUR / 6));
    while (order.status !== template.status) {
      at += step * HOUR;
      order = advanceOrder(order, new Date(Math.min(at, now.getTime())));
    }
    return { ...order, is_sample: true };
  });
}
