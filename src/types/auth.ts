// Customer authentication models. snake_case so they map to the API (docs/BACKEND_CONTRACTS.md). No
// password, one-time code or token is part of any stored model: the session is the backend's HTTP-only
// cookie, and a code exists only in the sign-in form's memory until it is submitted.

export type OtpChannel = "phone" | "email";

export interface AuthenticatedCustomer {
  id: string;
  full_name: string | null;
  email: string | null;
  /** E.164, such as +919876543210. */
  phone: string | null;
}

export interface AuthSession {
  customer: AuthenticatedCustomer;
  /** "development_mock" comes only from the development adapter and can never exist in a production build. */
  source: "backend" | "development_mock";
}

export interface OtpChallenge {
  challenge_id: string;
  channel: OtpChannel;
  /** Masked destination to show the customer. */
  destination_hint: string;
  expires_in_seconds: number;
  /** Minimum wait before another code can be requested. */
  resend_after_seconds: number;
  /** Development mock only, so a code can be typed without a message being sent. Never set by a backend. */
  development_code?: string;
}

export const authErrorCodes = [
  "invalid_otp",
  "expired_otp",
  "too_many_attempts",
  "rate_limited",
  "invalid_destination",
  "network_error",
  "timeout",
  "auth_unavailable",
  "provider_not_configured",
  "session_expired",
  /** The request body was refused (422). */
  "validation_error",
  /** Frontend only: verification succeeded but GET /auth/session didn't return the customer (cookie not kept). */
  "sign_in_not_confirmed",
  /** Google sign-in, sent back by the backend as ?auth_error= or returned by the link step. */
  "google_cancelled",
  "google_expired",
  "google_failed",
  "no_verified_email",
  "google_link_failed",
  "link_not_found",
  "unknown",
] as const;
export type AuthErrorCode = (typeof authErrorCodes)[number];

export type AuthMode = "backend" | "development_mock" | "unavailable";

/** The boundary the UI talks to; adapters live in services/auth. */
export interface AuthService {
  readonly mode: AuthMode;
  /** The verified session, or null when signed out. Rejects if that could not be determined. */
  getSession(): Promise<AuthSession | null>;
  requestOtp(request: { channel: OtpChannel; destination: string }): Promise<OtpChallenge>;
  verifyOtp(request: { channel: OtpChannel; challenge_id: string; code: string }): Promise<AuthSession>;
  /**
   * Starts Google sign-in by leaving for the provider. It never reports success: a customer counts as
   * signed in only when getSession() later returns the session the backend created.
   */
  startGoogleSignIn(returnTo: string): Promise<void>;
  /** A first Google sign-in's pending email code (found by the backend's link cookie). */
  getGoogleLink(): Promise<GoogleLinkStatus>;
  resendGoogleLink(): Promise<GoogleLinkStatus>;
  /** Confirms the code: the Google account is linked (or the account created). Never signs in by itself. */
  verifyGoogleLink(code: string): Promise<void>;
  signOut(): Promise<void>;
}

export interface GoogleLinkStatus {
  /** Null when a new code has to be sent first. */
  challenge_id: string | null;
  /** Masked, e.g. a•••@example.com. */
  destination_hint: string;
  expires_in_seconds: number;
  resend_after_seconds: number;
  delivered: boolean;
}
