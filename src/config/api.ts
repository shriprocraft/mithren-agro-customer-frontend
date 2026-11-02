import { safeExternalUrl } from "@/config/external-links";

// The one place that knows the backend's address and route names. Components never build API URLs:
// they call a service (services/*), which calls these. Contracts: docs/BACKEND_CONTRACTS.md.

/** The customer backend's base URL without a trailing slash, or null until one exists. */
export function resolveApiBaseUrl(value: string | undefined): string | null {
  return safeExternalUrl(value)?.replace(/\/+$/, "") ?? null;
}

export const apiBaseUrl = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

export const apiEndpoints = {
  auth: {
    session: "/auth/session",
    signOut: "/auth/sign-out",
    phoneOtpRequest: "/auth/otp/phone/request",
    phoneOtpVerify: "/auth/otp/phone/verify",
    emailOtpRequest: "/auth/otp/email/request",
    emailOtpVerify: "/auth/otp/email/verify",
    googleStart: "/auth/google/start",
  },
  geocoding: {
    reverse: "/geocoding/reverse",
  },
} as const;
