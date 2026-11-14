import type { AuthSession } from "@/types/auth";

// The rule for ordering, in one place: a session from the backend is required. This protects the
// customer journey only: the order API enforces the same rule on the server (docs/BACKEND_CONTRACTS.md).

export function canPlaceOrder(session: AuthSession | null): boolean {
  return Boolean(session?.customer?.id) && session?.source === "backend";
}

export function signInHref(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}

/** A same-site path to return to after sign-in, or `fallback` (never another site, nor the sign-in pages). */
export function safeNextPath(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/^\/(login|register)(\/|\?|$)/.test(next)) return fallback;
  return next;
}
