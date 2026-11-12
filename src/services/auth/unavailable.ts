import { AuthError } from "@/lib/auth-errors";
import type { AuthService } from "@/types/auth";

/** No backend is configured: nobody is signed in and nothing can pretend otherwise. */
export const unavailableAuthService: AuthService = {
  mode: "unavailable",
  getSession: async () => null,
  requestOtp: async () => {
    throw new AuthError("auth_unavailable");
  },
  verifyOtp: async () => {
    throw new AuthError("auth_unavailable");
  },
  startGoogleSignIn: async () => {
    throw new AuthError("auth_unavailable");
  },
  getGoogleLink: async () => {
    throw new AuthError("auth_unavailable");
  },
  resendGoogleLink: async () => {
    throw new AuthError("auth_unavailable");
  },
  verifyGoogleLink: async () => {
    throw new AuthError("auth_unavailable");
  },
  signOut: async () => undefined,
};
