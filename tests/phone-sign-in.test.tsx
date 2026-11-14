import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginView } from "@/components/account/LoginView";
import { RegisterView } from "@/components/account/RegisterView";
import { AppProviders } from "@/context/AppProviders";
import { ApiError } from "@/lib/api-client";
import { AuthError, authErrorMessage, formatWait } from "@/lib/auth-errors";
import { accountProfileService } from "@/services/profile";
import type { AuthenticatedCustomer, AuthService, AuthSession, OtpChallenge } from "@/types/auth";

// Phone sign-in against a stand-in for the real backend adapter (mode "backend"): the session check after
// verifying, the first-sign-in name step, and how each backend error reaches the customer.

const replace = vi.fn();
let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/login",
  useSearchParams: () => search,
}));

vi.mock("@/services/profile", () => ({
  accountProfileService: { get: vi.fn(), updateName: vi.fn() },
}));
const updateName = vi.mocked(accountProfileService!.updateName);

const CHALLENGE: OtpChallenge = { challenge_id: "c1", channel: "phone", destination_hint: "+91 ••••• •3210", expires_in_seconds: 300, resend_after_seconds: 30 };
const customer = (full_name: string | null): AuthenticatedCustomer => ({ id: "cust-1", full_name, email: null, phone: "+919876543210" });
const session = (full_name: string | null): AuthSession => ({ source: "backend", customer: customer(full_name) });

/** A backend whose session is whatever `current` holds; verifying "signs in" with `afterVerify`. */
function fakeBackend({ afterVerify = session("Asha"), ...overrides }: Partial<AuthService> & { afterVerify?: AuthSession | null } = {}) {
  let current: AuthSession | null = null;
  const service: AuthService = {
    mode: "backend",
    getSession: vi.fn(async () => current),
    requestOtp: vi.fn(async () => CHALLENGE),
    verifyOtp: vi.fn(async () => {
      current = afterVerify;
      return session("ignored: the session check decides");
    }),
    startGoogleSignIn: vi.fn(async () => undefined),
    getGoogleLink: vi.fn(async () => ({ challenge_id: "g1", destination_hint: "a•••@example.com", expires_in_seconds: 300, resend_after_seconds: 30, delivered: true })),
    resendGoogleLink: vi.fn(async () => ({ challenge_id: "g2", destination_hint: "a•••@example.com", expires_in_seconds: 300, resend_after_seconds: 30, delivered: true })),
    verifyGoogleLink: vi.fn(async () => undefined),
    signOut: vi.fn(async () => {
      current = null;
    }),
    ...overrides,
  };
  return { service, setSession: (next: AuthSession | null) => (current = next) };
}

const view = (service: AuthService) => render(<AppProviders authService={service}><LoginView /></AppProviders>);

async function sendCode(number = "98765 43210") {
  fireEvent.change(await screen.findByLabelText("Mobile number"), { target: { value: number } });
  fireEvent.click(screen.getByRole("button", { name: "Send code" }));
}

async function enterCode(code = "123456") {
  fireEvent.change(await screen.findByLabelText("One-time code"), { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  replace.mockClear();
  updateName.mockReset();
  search = new URLSearchParams();
});

describe("phone sign-in with the backend", () => {
  it("sends the normalised number, shows the masked hint and never a code", async () => {
    const { service } = fakeBackend();
    view(service);
    await sendCode("098765-43210");

    expect(service.requestOtp).toHaveBeenCalledWith({ channel: "phone", destination: "+919876543210" });
    expect(await screen.findByText("+91 ••••• •3210")).toBeInTheDocument();
    expect(screen.getByTestId("code-expiry")).toHaveTextContent("Code expires in 5:00");
    expect(screen.queryByTestId("development-code")).toBeNull();
    expect(screen.getByRole("button", { name: /Resend code in \d+s/ })).toBeDisabled();
  });

  it("signs in only when GET /auth/session returns the customer, then returns to the requested page", async () => {
    search = new URLSearchParams("next=/checkout/address");
    const { service } = fakeBackend();
    view(service);
    await sendCode();
    await enterCode();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/checkout/address"));
    expect(service.verifyOtp).toHaveBeenCalledWith({ channel: "phone", challenge_id: "c1", code: "123456" });
    // Once on load, once after verifying.
    expect(service.getSession).toHaveBeenCalledTimes(2);
  });

  it("stays signed out when the session check doesn't return a customer (cookie not kept)", async () => {
    search = new URLSearchParams("next=/checkout/address");
    const { service } = fakeBackend({ afterVerify: null });
    view(service);
    await sendCode();
    await enterCode();

    expect(await screen.findByText(/couldn’t confirm your sign-in/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify and continue" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("asks a new customer for their name, saves it, refreshes the session and then continues", async () => {
    search = new URLSearchParams("next=/checkout/address");
    const backend = fakeBackend({ afterVerify: session(null) });
    updateName.mockImplementation(async (name) => {
      backend.setSession(session(name.trim()));
      return customer(name.trim());
    });
    view(backend.service);
    await sendCode();
    await enterCode();

    expect(await screen.findByText("What should we call you?")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));
    expect(await screen.findByText("Enter your full name")).toBeInTheDocument();
    expect(updateName).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: " Asha Ramesh " } });
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/checkout/address"));
    expect(updateName).toHaveBeenCalledWith(" Asha Ramesh ");
    expect(backend.service.getSession).toHaveBeenCalledTimes(3);
  });

  it("keeps the name step open when saving fails, with a clear message", async () => {
    search = new URLSearchParams("next=/products");
    const { service } = fakeBackend({ afterVerify: session(null) });
    updateName.mockRejectedValueOnce(new ApiError("validation_error", "", 422)).mockRejectedValueOnce(new ApiError("network_error", "", null));
    view(service);
    await sendCode();
    await enterCode();
    fireEvent.change(await screen.findByLabelText("Full name"), { target: { value: "Asha" } });

    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));
    expect(await screen.findByText(/That name can’t be used/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));
    expect(await screen.findByText(/couldn’t reach the server/)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("lets the customer skip the name, refreshes the session, and asks again at the next sign-in", async () => {
    const { service } = fakeBackend({ afterVerify: session(null) });
    view(service);
    await sendCode();
    await enterCode();
    fireEvent.click(await screen.findByRole("button", { name: "Skip for now" }));

    expect(await screen.findByText(/You’re signed in as \+919876543210/)).toBeInTheDocument();
    expect(updateName).not.toHaveBeenCalled();
    expect(service.getSession).toHaveBeenCalledTimes(3);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await sendCode();
    await enterCode();
    expect(await screen.findByText("What should we call you?")).toBeInTheDocument();
  });

  it("doesn't ask a customer who already has a name", async () => {
    const { service } = fakeBackend({ afterVerify: session("Asha") });
    view(service);
    await sendCode();
    await enterCode();
    expect(await screen.findByText(/You’re signed in as Asha/)).toBeInTheDocument();
    expect(screen.queryByText("What should we call you?")).toBeNull();
  });
});

describe("phone sign-in errors", () => {
  it("shows a rate limit with the wait, and keeps Send disabled until it is over", async () => {
    const { service } = fakeBackend({ requestOtp: vi.fn().mockRejectedValue(new AuthError("rate_limited", 27)) });
    view(service);
    await sendCode();

    expect(await screen.findByText(/Please wait (27|26) seconds/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send code \(wait (27|26)s\)/ })).toBeDisabled();
  });

  it("shows the backend's refusal of a number on the field", async () => {
    const { service } = fakeBackend({ requestOtp: vi.fn().mockRejectedValue(new AuthError("invalid_destination")) });
    view(service);
    await sendCode();
    expect(await screen.findByText(/doesn’t look like an Indian mobile number/)).toBeInTheDocument();
  });

  it.each([
    ["provider_not_configured", /Sign-in by text message isn’t available right now/],
    ["auth_unavailable", /Sign-in is temporarily unavailable/],
    ["network_error", /couldn’t reach the server/],
    ["timeout", /That took too long/],
  ] as const)("explains %s when a code can't be sent", async (code, message) => {
    const { service } = fakeBackend({ requestOtp: vi.fn().mockRejectedValue(new AuthError(code)) });
    view(service);
    await sendCode();
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send code" })).toBeEnabled();
  });

  it("lets the customer retry a wrong code", async () => {
    const { service } = fakeBackend({ verifyOtp: vi.fn().mockRejectedValue(new AuthError("invalid_otp")) });
    view(service);
    await sendCode();
    await enterCode();
    expect(await screen.findByText(/That code isn’t correct/)).toBeInTheDocument();
    expect(screen.getByLabelText("One-time code")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Verify and continue" })).toBeEnabled();
  });

  it.each([
    ["too_many_attempts", /Too many incorrect attempts/],
    ["expired_otp", /That code has expired/],
  ] as const)("after %s, the code can't be retried but a new one can be requested at once", async (code, message) => {
    const { service } = fakeBackend({ verifyOtp: vi.fn().mockRejectedValue(new AuthError(code)) });
    view(service);
    await sendCode();
    await enterCode();
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText("One-time code")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled();
  });

  it("shows a resend rate limit as a countdown on the resend button", async () => {
    const requestOtp = vi.fn().mockResolvedValueOnce({ ...CHALLENGE, resend_after_seconds: 0 }).mockRejectedValueOnce(new AuthError("rate_limited", 45));
    const { service } = fakeBackend({ requestOtp });
    view(service);
    await sendCode();
    fireEvent.click(await screen.findByRole("button", { name: "Resend code" }));
    expect(await screen.findByRole("button", { name: /Resend code in (45|44)s/ })).toBeDisabled();
    expect(screen.getByText(/Please wait (45|44) seconds/)).toBeInTheDocument();
  });

  it("stops accepting a code once it has expired locally", async () => {
    const { service } = fakeBackend({ requestOtp: vi.fn().mockResolvedValue({ ...CHALLENGE, expires_in_seconds: 1, resend_after_seconds: 1 }) });
    view(service);
    await sendCode();
    expect(await screen.findByText(/That code has expired/, undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify and continue" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled();
    expect(service.verifyOtp).not.toHaveBeenCalled();
  });

  it("only accepts six ASCII digits in the code field", async () => {
    const { service } = fakeBackend();
    view(service);
    await sendCode();
    const input = await screen.findByLabelText("One-time code");
    fireEvent.change(input, { target: { value: "१२३४५६" } });
    expect(input).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));
    expect(await screen.findByText("Enter all 6 digits of the code.")).toBeInTheDocument();
    expect(service.verifyOtp).not.toHaveBeenCalled();
  });

  it("formats waits and keeps Google's message for the Google redirect only", () => {
    expect(formatWait(1)).toBe("1 second");
    expect(formatWait(59)).toBe("59 seconds");
    expect(formatWait(61)).toBe("2 minutes");
    expect(authErrorMessage("provider_not_configured", { context: "google" })).toMatch(/Google sign-in isn’t connected yet/);
    expect(authErrorMessage("provider_not_configured")).not.toMatch(/Google/);
  });
});

describe("sign-up with the backend", () => {
  it("points to sign-in instead of a sign-up form", async () => {
    const { service } = fakeBackend();
    render(<AppProviders authService={service}><RegisterView /></AppProviders>);
    expect(await screen.findByRole("link", { name: "Go to sign in" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: /Create account \(preview\)/ })).toBeNull();
  });

  it("tells a new customer on the sign-in page that signing in creates the account", async () => {
    const { service } = fakeBackend();
    view(service);
    expect(await screen.findByText(/Signing in with your mobile number, email or Google creates your account/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Create an account \(preview\)/ })).toBeNull();
  });
});
