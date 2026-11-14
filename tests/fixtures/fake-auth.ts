import { AuthError } from "@/lib/auth-errors";
import type { AuthenticatedCustomer, AuthService, AuthSession, OtpChallenge, OtpChannel } from "@/types/auth";

// TEST DOUBLE for the backend auth API, used only by the test suite (it is not part of the app). It
// behaves like the real one-time-code flow (random codes, expiry, attempt limit) so the sign-in screens
// can be exercised without a server. The code it generates is read with `lastCode()`, never shown on screen.

const OTP_LIFETIME_SECONDS = 300;
const RESEND_AFTER_SECONDS = 30;
const MAX_ATTEMPTS = 5;

interface PendingChallenge {
  channel: OtpChannel;
  destination: string;
  code: string;
  expires_at: number;
  attempts: number;
}

export interface FakeAuthService extends AuthService {
  /** The most recently generated code. */
  lastCode(): string | undefined;
  /** The session the fake currently holds (what GET /auth/session would return). */
  currentSession(): AuthSession | null;
}

function randomCode(): string {
  return String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, "0");
}

function mask(channel: OtpChannel, destination: string): string {
  if (channel === "phone") return `••••••${destination.slice(-4)}`;
  const [name = "", domain = ""] = destination.split("@");
  return `${name.charAt(0)}•••@${domain}`;
}

export function createFakeAuthService(): FakeAuthService {
  const challenges = new Map<string, PendingChallenge>();
  let session: AuthSession | null = null;
  let last: string | undefined;

  return {
    mode: "backend",
    lastCode: () => last,
    currentSession: () => session,
    getSession: async () => session,
    async requestOtp({ channel, destination }): Promise<OtpChallenge> {
      const challenge_id = `fake-${crypto.randomUUID()}`;
      last = randomCode();
      challenges.set(challenge_id, { channel, destination, code: last, expires_at: Date.now() + OTP_LIFETIME_SECONDS * 1000, attempts: 0 });
      return { challenge_id, channel, destination_hint: mask(channel, destination), expires_in_seconds: OTP_LIFETIME_SECONDS, resend_after_seconds: RESEND_AFTER_SECONDS };
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
        id: `customer-${crypto.randomUUID()}`,
        // A returning customer with a name, so tests go straight back to `next` (the name step has its own tests).
        full_name: "Test Customer",
        email: channel === "email" ? pending.destination : null,
        phone: channel === "phone" ? pending.destination : null,
      };
      session = { customer, source: "backend" };
      return session;
    },
    startGoogleSignIn: async () => undefined,
    getGoogleLink: async () => {
      throw new AuthError("link_not_found");
    },
    resendGoogleLink: async () => {
      throw new AuthError("link_not_found");
    },
    verifyGoogleLink: async () => {
      throw new AuthError("link_not_found");
    },
    async signOut() {
      session = null;
    },
  };
}
