import { AuthError } from "@/lib/auth-errors";
import type { AuthenticatedCustomer, AuthService, AuthSession, OtpChallenge, OtpChannel } from "@/types/auth";

// DEVELOPMENT MOCK. NOT AUTHENTICATION. It lets the sign-in screens and the checkout gate be exercised
// on a developer's machine before a backend exists. It verifies nobody: no message is sent, the code it
// generates is shown on screen, and anyone can pass. It refuses to run in a production build (and
// services/auth/index.ts never selects it there). There is no hard-coded code: each is random and lives
// only in this object's memory. The session marker holds no code or token. Google is never simulated.

const OTP_LIFETIME_SECONDS = 300;
const RESEND_AFTER_SECONDS = 30;
const MAX_ATTEMPTS = 5;
export const MOCK_SESSION_KEY = "mithren.dev-mock-auth-session";

interface PendingChallenge {
  channel: OtpChannel;
  destination: string;
  code: string;
  expires_at: number;
  attempts: number;
}

function randomCode(): string {
  return String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, "0");
}

function mask(channel: OtpChannel, destination: string): string {
  if (channel === "phone") return `••••••${destination.slice(-4)}`;
  const [name = "", domain = ""] = destination.split("@");
  return `${name.charAt(0)}•••@${domain}`;
}

function readSession(): AuthSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(MOCK_SESSION_KEY) ?? "null") as { customer?: AuthenticatedCustomer } | null;
    return value?.customer?.id?.startsWith("dev-mock-") ? { customer: value.customer, source: "development_mock" } : null;
  } catch {
    return null;
  }
}

export function createDevelopmentMockAuthService(nodeEnv: string | undefined = process.env.NODE_ENV): AuthService {
  if (nodeEnv === "production") throw new Error("The development mock sign-in cannot run in a production build.");
  const challenges = new Map<string, PendingChallenge>();

  return {
    mode: "development_mock",
    getSession: async () => readSession(),
    async requestOtp({ channel, destination }): Promise<OtpChallenge> {
      const challenge_id = `dev-${crypto.randomUUID()}`;
      const code = randomCode();
      challenges.set(challenge_id, { channel, destination, code, expires_at: Date.now() + OTP_LIFETIME_SECONDS * 1000, attempts: 0 });
      return { challenge_id, channel, destination_hint: mask(channel, destination), expires_in_seconds: OTP_LIFETIME_SECONDS, resend_after_seconds: RESEND_AFTER_SECONDS, development_code: code };
    },
    async verifyOtp({ channel, challenge_id, code }) {
      const pending = challenges.get(challenge_id);
      if (!pending || pending.channel !== channel) throw new AuthError("expired_otp");
      if (Date.now() >= pending.expires_at) {
        challenges.delete(challenge_id);
        throw new AuthError("expired_otp");
      }
      if (code !== pending.code) {
        pending.attempts += 1;
        if (pending.attempts >= MAX_ATTEMPTS) {
          challenges.delete(challenge_id);
          throw new AuthError("too_many_attempts");
        }
        throw new AuthError("invalid_otp");
      }
      challenges.delete(challenge_id);
      const customer: AuthenticatedCustomer = {
        id: `dev-mock-${crypto.randomUUID()}`,
        full_name: null,
        email: channel === "email" ? pending.destination : null,
        phone: channel === "phone" ? pending.destination : null,
      };
      try {
        sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ customer }));
      } catch {
        // Storage blocked: the mock session lasts until the next full page load.
      }
      return { customer, source: "development_mock" };
    },
    async startGoogleSignIn() {
      throw new AuthError("provider_not_configured");
    },
    // Google is never simulated, so there is never a pending Google link either.
    async getGoogleLink() {
      throw new AuthError("link_not_found");
    },
    async resendGoogleLink() {
      throw new AuthError("link_not_found");
    },
    async verifyGoogleLink() {
      throw new AuthError("link_not_found");
    },
    async signOut() {
      try {
        sessionStorage.removeItem(MOCK_SESSION_KEY);
      } catch {
        // Nothing stored.
      }
    },
  };
}
