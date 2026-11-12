import { authErrorCodes, type AuthErrorCode } from "@/types/auth";

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    readonly retryAfterSeconds?: number,
  ) {
    super(authErrorMessage(code, { retryAfterSeconds }));
    this.name = "AuthError";
  }
}

export function toAuthErrorCode(code: string): AuthErrorCode {
  return (authErrorCodes as readonly string[]).includes(code) ? (code as AuthErrorCode) : "unknown";
}

/** "27 seconds", "1 minute", "59 minutes". */
export function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

/**
 * What the customer reads for each error. Never includes a code, a token or a full phone number.
 * `retryAfterSeconds` (from the backend's retry_after_seconds) makes a rate limit say how long to wait;
 * `context: "google"` is for the Google redirect, whose provider_not_configured means Google, not SMS.
 */
export function authErrorMessage(code: AuthErrorCode, options: { retryAfterSeconds?: number; context?: "otp" | "email" | "google" } = {}): string {
  const { retryAfterSeconds, context = "otp" } = options;
  switch (code) {
    case "invalid_otp":
      return "That code isn’t correct. Check it and try again.";
    case "expired_otp":
      return "That code has expired or can’t be used any more. Request a new one.";
    case "too_many_attempts":
      return "Too many incorrect attempts. Request a new code.";
    case "rate_limited":
      return retryAfterSeconds && retryAfterSeconds > 0
        ? `Too many requests. Please wait ${formatWait(retryAfterSeconds)} before trying again.`
        : "Too many requests. Please wait a moment and try again.";
    case "invalid_destination":
      return context === "email"
        ? "That doesn’t look like an email address. Check it and try again."
        : "That doesn’t look like an Indian mobile number. Check it and try again.";
    case "network_error":
      return "We couldn’t reach the server. Check your connection and try again.";
    case "timeout":
      return "That took too long. Please try again.";
    case "auth_unavailable":
      return "Sign-in is temporarily unavailable. Please try again shortly.";
    case "provider_not_configured":
      return context === "google"
        ? "Google sign-in isn’t connected yet. You have not been signed in. Please use your mobile number or email instead."
        : context === "email"
          ? "Sign-in by email isn’t available right now. Please use your mobile number instead."
          : "Sign-in by text message isn’t available right now. Please try again later.";
    case "session_expired":
      return "Your session has ended. Please sign in again.";
    case "validation_error":
      return "Check the details you entered and try again.";
    case "google_cancelled":
      return "Google sign-in was cancelled. You have not been signed in.";
    case "google_expired":
      return "That Google sign-in took too long. Please try again.";
    case "google_failed":
      return "We couldn’t sign you in with Google. Please try again, or use your mobile number or email.";
    case "no_verified_email":
      return "Your Google account has no verified email address, so it can’t be used here. Please use your mobile number or email.";
    case "google_link_failed":
      return "We couldn’t connect this Google account. Please sign in with your mobile number or email instead.";
    case "link_not_found":
      return "This Google sign-in has expired. Please start again.";
    case "sign_in_not_confirmed":
      return "We couldn’t confirm your sign-in. Please try again, and check that this browser allows cookies for this site.";
    default:
      return "Something went wrong. Please try again.";
  }
}
