import { apiEndpoints } from "@/config/api";
import { ApiError, type ApiClient } from "@/lib/api-client";
import { AuthError, toAuthErrorCode } from "@/lib/auth-errors";
import type { AuthenticatedCustomer, AuthService, AuthSession, GoogleLinkStatus, OtpChallenge } from "@/types/auth";

// The real adapter: every decision is the backend's (docs/BACKEND_CONTRACTS.md). The session is its
// HTTP-only cookie; nothing here stores anything, and a session is only ever what the backend returned.

function rethrow(error: unknown): never {
  if (error instanceof AuthError) throw error;
  if (error instanceof ApiError) throw new AuthError(toAuthErrorCode(error.code), error.retryAfterSeconds);
  throw new AuthError("unknown");
}

const toSession = (customer: AuthenticatedCustomer): AuthSession => ({ customer, source: "backend" });

/** Only the documented fields. development_code belongs to the development mock and is never taken from a
 * backend response, so no code could ever be shown on screen from the API. */
function toChallenge(response: OtpChallenge | null | undefined): OtpChallenge {
  if (!response?.challenge_id) throw new AuthError("unknown");
  const { challenge_id, channel, destination_hint, expires_in_seconds, resend_after_seconds } = response;
  return { challenge_id, channel, destination_hint, expires_in_seconds, resend_after_seconds };
}

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
        return toChallenge(
          await client.request<OtpChallenge>(channel === "phone" ? auth.phoneOtpRequest : auth.emailOtpRequest, {
            method: "POST",
            body: channel === "phone" ? { phone: destination } : { email: destination },
          }),
        );
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
    async getGoogleLink() {
      try {
        return await client.request<GoogleLinkStatus>(auth.googleLink);
      } catch (error) {
        rethrow(error);
      }
    },
    async resendGoogleLink() {
      try {
        return await client.request<GoogleLinkStatus>(auth.googleLinkResend, { method: "POST" });
      } catch (error) {
        rethrow(error);
      }
    },
    async verifyGoogleLink(code) {
      try {
        await client.request(auth.googleLinkVerify, { method: "POST", body: { code } });
      } catch (error) {
        rethrow(error);
      }
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
