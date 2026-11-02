import type { AuthSession } from "@/types/auth";

// The rule for ordering, in one place: a verified session is required. The demo account's marker is
// not a session and never reaches this check. A development mock session is refused in a production
// build. This protects the customer journey only: when orders move to the backend, the order API must
// enforce the same rule on the server (docs/BACKEND_CONTRACTS.md).

export function canPlaceOrder(session: AuthSession | null, nodeEnv: string | undefined = process.env.NODE_ENV): boolean {
  if (!session?.customer?.id) return false;
  return session.source === "backend" || (session.source === "development_mock" && nodeEnv !== "production");
}

export function signInHref(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
