"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthError } from "@/lib/auth-errors";
import { getAuthService } from "@/services/auth";
import type { AuthMode, AuthService, AuthSession, OtpChallenge, OtpChannel } from "@/types/auth";

// The customer's sign-in state, separate from the demo account (context/DemoAccountContext.tsx), whose
// marker proves nothing and never counts as signed in. The session is read from the configured adapter
// on load. If that fails, the customer is treated as signed out, so checkout fails closed.
interface AuthValue {
  /** "loading" until the session check has finished; show a loading state, not a signed-out one. */
  status: "loading" | "anonymous" | "authenticated";
  session: AuthSession | null;
  mode: AuthMode;
  requestOtp: (request: { channel: OtpChannel; destination: string }) => Promise<OtpChallenge>;
  /**
   * Checks the code, then reads GET /auth/session: the customer counts as signed in only if that returns
   * them (so the browser really kept the cookie). Rejects with an AuthError otherwise.
   */
  verifyOtp: (request: { channel: OtpChannel; challenge_id: string; code: string }) => Promise<void>;
  /** Reads the session again (for example after the name was saved). A failure keeps the current state. */
  refreshSession: () => Promise<void>;
  /**
   * True right after a backend sign-in whose customer has no name yet: the sign-in page asks for one
   * before continuing. Never for the development mock. Skipping only lasts until the next sign-in.
   */
  needsName: boolean;
  /** Ends the name step (saved or skipped) for this sign-in. */
  finishOnboarding: () => void;
  startGoogleSignIn: (returnTo: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children, service }: { children: ReactNode; service?: AuthService }) {
  const auth = service ?? getAuthService();
  const [state, setState] = useState<{ status: AuthValue["status"]; session: AuthSession | null }>({ status: "loading", session: null });
  // Set by a successful verification in this page, cleared once the name step is done or on sign-out.
  const [justSignedIn, setJustSignedIn] = useState(false);

  useEffect(() => {
    let live = true;
    auth.getSession().then(
      (session) => {
        if (live) setState({ status: session ? "authenticated" : "anonymous", session });
      },
      () => {
        if (live) setState({ status: "anonymous", session: null });
      },
    );
    return () => {
      live = false;
    };
  }, [auth]);

  const verifyOtp = useCallback<AuthValue["verifyOtp"]>(
    async (request) => {
      await auth.verifyOtp(request);
      let session: AuthSession | null;
      try {
        session = await auth.getSession();
      } catch {
        session = null;
      }
      if (!session) {
        setState({ status: "anonymous", session: null });
        throw new AuthError("sign_in_not_confirmed");
      }
      setState({ status: "authenticated", session });
      setJustSignedIn(true);
    },
    [auth],
  );

  const finishOnboarding = useCallback(() => setJustSignedIn(false), []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await auth.getSession();
      setState({ status: session ? "authenticated" : "anonymous", session });
    } catch {
      // Couldn't be determined right now: keep what we had rather than signing the customer out.
    }
  }, [auth]);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setState({ status: "anonymous", session: null });
    setJustSignedIn(false);
  }, [auth]);

  const needsName =
    justSignedIn && state.status === "authenticated" && state.session?.source === "backend" && !state.session.customer.full_name;

  const value = useMemo<AuthValue>(
    () => ({
      ...state,
      mode: auth.mode,
      requestOtp: (request) => auth.requestOtp(request),
      verifyOtp,
      refreshSession,
      needsName,
      finishOnboarding,
      startGoogleSignIn: (returnTo) => auth.startGoogleSignIn(returnTo),
      signOut,
    }),
    [state, auth, verifyOtp, refreshSession, needsName, finishOnboarding, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside AuthProvider");
  return auth;
}

/** The sign-in state, or null outside AuthProvider (stores that also work without sign-in use this). */
export function useOptionalAuth() {
  return useContext(AuthContext);
}

/** The signed-in customer's id when the session comes from the real backend (never the development mock). */
export function useBackendCustomerId(): string | null {
  const auth = useOptionalAuth();
  return auth?.status === "authenticated" && auth.session?.source === "backend" ? auth.session.customer.id : null;
}
