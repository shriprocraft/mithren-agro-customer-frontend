import { apiEndpoints } from "@/config/api";
import { ApiError, type ApiClient } from "@/lib/api-client";
import { AuthError, toAuthErrorCode } from "@/lib/auth-errors";
import type { AuthenticatedCustomer, AuthService, AuthSession, OtpChallenge } from "@/types/auth";

// The real adapter: every decision is the backend's (docs/BACKEND_CONTRACTS.md). The session is its
// HTTP-only cookie; nothing here stores anything, and a session is only ever what the backend returned.

function rethrow(error: unknown): never {
  if (error instanceof AuthError) throw error;
  if (error instanceof ApiError) throw new AuthError(toAuthErrorCode(error.code), error.retryAfterSeconds);
  throw new AuthError("unknown");
}

const toSession = (customer: AuthenticatedCustomer): AuthSession => ({ customer, source: "backend" });

export function createHttpAuthService(client: ApiClient, baseUrl: string, navigate: (url: string) => void = (url) => window.location.assign(url)): AuthService {
  const { auth } = apiEndpoints;
  return {
    mode: "backend",
    async getSession() {
      try {
        const response = await client.request<{ customer: AuthenticatedCustomer | null }>(auth.session);
        return response?.customer?.id ? toSession(response.customer) : null;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        rethrow(error);
      }
    },
    async requestOtp({ channel, destination }) {
      try {
        return await client.request<OtpChallenge>(channel === "phone" ? auth.phoneOtpRequest : auth.emailOtpRequest, {
          method: "POST",
          body: channel === "phone" ? { phone: destination } : { email: destination },
        });
      } catch (error) {
        rethrow(error);
      }
    },
    async verifyOtp({ channel, challenge_id, code }) {
      try {
        const response = await client.request<{ customer: AuthenticatedCustomer }>(channel === "phone" ? auth.phoneOtpVerify : auth.emailOtpVerify, {
          method: "POST",
          body: { challenge_id, code },
        });
        if (!response?.customer?.id) throw new AuthError("unknown");
        return toSession(response.customer);
      } catch (error) {
        rethrow(error);
      }
    },
    async startGoogleSignIn(returnTo) {
      navigate(`${baseUrl}${auth.googleStart}?${new URLSearchParams({ return_to: returnTo }).toString()}`);
    },
    async signOut() {
      try {
        await client.request(auth.signOut, { method: "POST" });
      } catch (error) {
        rethrow(error);
      }
    },
  };
}
