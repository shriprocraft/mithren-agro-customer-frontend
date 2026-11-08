// Which sign-in methods are offered. Only phone OTP exists on the backend so far (docs/BACKEND_CONTRACTS.md).
// These apply in every auth mode, including the development mock, so nothing on screen looks usable
// before it is connected. Turn one on only once its backend flow is implemented and verified.
export const authFeatures = {
  /** Email one-time codes: no email provider yet, so the Email tab is hidden. */
  emailOtp: false,
  /** Google sign-in: not implemented yet, so the button is shown disabled as "Coming soon". */
  googleSignIn: false,
} as const;
