import { authErrorCodes, type AuthErrorCode } from "@/types/auth";

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    readonly retryAfterSeconds?: number,
  ) {
    super(authErrorMessage(code));
    this.name = "AuthError";
  }
}

export function toAuthErrorCode(code: string): AuthErrorCode {
  return (authErrorCodes as readonly string[]).includes(code) ? (code as AuthErrorCode) : "unknown";
}

export function authErrorMessage(code: AuthErrorCode): string {
  switch (code) {
    case "invalid_otp":
      return "That code isn’t correct. Check it and try again.";
    case "expired_otp":
      return "That code has expired. Request a new one.";
    case "too_many_attempts":
      return "Too many incorrect attempts. Request a new code.";
    case "rate_limited":
      return "Too many requests. Please wait a moment and try again.";
    case "invalid_destination":
      return "We can’t send a code there. Check the details and try again.";
    case "network_error":
      return "We couldn’t reach the server. Check your connection and try again.";
    case "timeout":
      return "That took too long. Please try again.";
    case "auth_unavailable":
      return "Sign-in isn’t connected on this site yet.";
    case "provider_not_configured":
      return "Google sign-in isn’t connected yet. You have not been signed in. Please use your phone or email instead.";
    case "session_expired":
      return "Your session has ended. Please sign in again.";
    default:
      return "Something went wrong. Please try again.";
  }
}
