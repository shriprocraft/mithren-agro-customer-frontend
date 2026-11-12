import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginView } from "@/components/account/LoginView";
import { AppProviders } from "@/context/AppProviders";
import { type ApiClient } from "@/lib/api-client";
import { AuthError } from "@/lib/auth-errors";
import { createHttpAuthService } from "@/services/auth/http";
import type { AuthService, AuthSession, GoogleLinkStatus, OtpChallenge } from "@/types/auth";

// Email codes and Google sign-in against a stand-in backend adapter (mode "backend").

const replace = vi.fn();
let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/login",
  useSearchParams: () => search,
}));

const EMAIL_CHALLENGE: OtpChallenge = { challenge_id: "e1", channel: "email", destination_hint: "a•••@example.com", expires_in_seconds: 300, resend_after_seconds: 30 };
const LINK: GoogleLinkStatus = { challenge_id: "g1", destination_hint: "a•••@example.com", expires_in_seconds: 300, resend_after_seconds: 0, delivered: true };
const signedIn: AuthSession = { source: "backend", customer: { id: "c1", full_name: "Asha", email: "asha@example.com", phone: null } };

function fakeBackend(overrides: Partial<AuthService> = {}) {
  let current: AuthSession | null = null;
  const service = {
    mode: "backend" as const,
    getSession: vi.fn(async () => current),
    requestOtp: vi.fn(async () => EMAIL_CHALLENGE),
    verifyOtp: vi.fn(async () => {
      current = signedIn;
      return signedIn;
    }),
    startGoogleSignIn: vi.fn(async () => undefined),
    getGoogleLink: vi.fn(async () => LINK),
    resendGoogleLink: vi.fn(async () => ({ ...LINK, challenge_id: "g2", resend_after_seconds: 30 })),
    verifyGoogleLink: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    ...overrides,
  };
  return service;
}

const view = (service: AuthService) => render(<AppProviders authService={service}><LoginView /></AppProviders>);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  replace.mockClear();
  search = new URLSearchParams();
});

describe("auth HTTP adapter", () => {
  it("uses the email and Google link routes", async () => {
    const calls: unknown[] = [];
    const client: ApiClient = {
      request: async <T,>(path: string, options?: unknown) => {
        calls.push([path, options]);
        return (path.includes("google") ? LINK : EMAIL_CHALLENGE) as T;
      },
    };
    const navigate = vi.fn();
    const service = createHttpAuthService(client, "https://api.example.com/api/v1", navigate);
    await service.requestOtp({ channel: "email", destination: "asha@example.com" });
    await service.getGoogleLink();
    await service.resendGoogleLink();
    await service.verifyGoogleLink("123456");
    await service.startGoogleSignIn("/login?next=%2Fcart");
    expect(calls).toEqual([
      ["/auth/otp/email/request", { method: "POST", body: { email: "asha@example.com" } }],
      ["/auth/google/link", undefined],
      ["/auth/google/link/resend", { method: "POST" }],
      ["/auth/google/link/verify", { method: "POST", body: { code: "123456" } }],
    ]);
    expect(navigate).toHaveBeenCalledWith("https://api.example.com/api/v1/auth/google/start?return_to=%2Flogin%3Fnext%3D%252Fcart");
  });
});

describe("email sign-in", () => {
  it("sends a lower-cased email, shows the masked hint and signs in with the code", async () => {
    const service = fakeBackend();
    view(service);
    fireEvent.click(await screen.findByRole("radio", { name: "Email" }));
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: " Asha@Example.com " } });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    expect(await screen.findByText("a•••@example.com")).toBeInTheDocument();
    expect(service.requestOtp).toHaveBeenCalledWith({ channel: "email", destination: "asha@example.com" });
    fireEvent.change(screen.getByLabelText("One-time code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));
    await waitFor(() => expect(service.verifyOtp).toHaveBeenCalledWith({ channel: "email", challenge_id: "e1", code: "123456" }));
  });

  it("explains an unavailable email provider in email terms", async () => {
    view(fakeBackend({ requestOtp: vi.fn(async () => { throw new AuthError("provider_not_configured"); }) }));
    fireEvent.click(await screen.findByRole("radio", { name: "Email" }));
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "asha@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    expect(await screen.findByText(/Sign-in by email isn’t available right now/)).toBeInTheDocument();
  });
});

describe("Google sign-in", () => {
  it("offers Google with the backend and returns to this page afterwards", async () => {
    search = new URLSearchParams("next=/checkout/address");
    const service = fakeBackend();
    view(service);
    const google = await screen.findByRole("button", { name: "Continue with Google" });
    expect(google).toBeEnabled();
    fireEvent.click(google);
    await waitFor(() => expect(service.startGoogleSignIn).toHaveBeenCalledWith("/login?next=%2Fcheckout%2Faddress"));
  });

  it("explains each Google error sent back by the backend", async () => {
    for (const [code, text] of [
      ["google_cancelled", /Google sign-in was cancelled/],
      ["no_verified_email", /has no verified email address/],
      ["google_failed", /couldn’t sign you in with Google/],
    ] as const) {
      search = new URLSearchParams(`auth_error=${code}`);
      const { unmount } = view(fakeBackend());
      expect(await screen.findByText(text)).toBeInTheDocument();
      unmount();
    }
  });

  it("confirms the email code of a first Google sign-in, then signs in with Google again", async () => {
    search = new URLSearchParams("google=verify-email&next=/cart");
    const service = fakeBackend();
    view(service);
    expect(await screen.findByText(/We sent a 6-digit code to/)).toHaveTextContent("a•••@example.com");
    fireEvent.change(screen.getByLabelText("Email code"), { target: { value: "12a3456" } });
    expect(screen.getByLabelText("Email code")).toHaveValue("123456");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Confirm and continue" })));
    expect(service.verifyGoogleLink).toHaveBeenCalledWith("123456");
    await waitFor(() => expect(service.startGoogleSignIn).toHaveBeenCalledWith("/login?next=%2Fcart"));
    expect(service.verifyOtp).not.toHaveBeenCalled(); // no session comes from linking
  });

  it("stops when the Google account can't be connected, and offers another way", async () => {
    search = new URLSearchParams("google=verify-email");
    const service = fakeBackend({ verifyGoogleLink: vi.fn(async () => { throw new AuthError("google_link_failed"); }) });
    view(service);
    fireEvent.change(await screen.findByLabelText("Email code"), { target: { value: "123456" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Confirm and continue" })));
    expect(await screen.findByText(/couldn’t connect this Google account/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Email code")).toBeNull();
    expect(service.startGoogleSignIn).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Use another way to sign in/ }));
    expect(replace).toHaveBeenCalledWith("/login?next=%2F");
  });

  it("sends a new code and counts down before the next one", async () => {
    search = new URLSearchParams("google=verify-email");
    const service = fakeBackend();
    view(service);
    const resend = await screen.findByRole("button", { name: "Resend code" });
    await act(async () => fireEvent.click(resend));
    expect(service.resendGoogleLink).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: /Resend code in \d+s/ })).toBeDisabled();
  });

  it("explains an expired Google sign-in", async () => {
    search = new URLSearchParams("google=verify-email");
    view(fakeBackend({ getGoogleLink: vi.fn(async () => { throw new AuthError("link_not_found"); }) }));
    expect(await screen.findByText(/This Google sign-in has expired/)).toBeInTheDocument();
  });
});
