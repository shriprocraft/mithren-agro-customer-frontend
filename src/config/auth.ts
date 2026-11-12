// Which sign-in methods are offered (docs/BACKEND_CONTRACTS.md). Email codes work in every auth mode
// (the development mock simulates them). Google is real only with the backend: elsewhere the button
// stays disabled as "Coming soon", since the mock never pretends to sign anyone in with Google.
export const authFeatures = {
  /** Email one-time codes: POST /auth/otp/email/request and /verify. */
  emailOtp: true,
  /** Google sign-in: GET /auth/google/start, then the email-code step a first Google sign-in needs. */
  googleSignIn: true,
} as const;
