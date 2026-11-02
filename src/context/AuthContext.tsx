"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
  verifyOtp: (request: { channel: OtpChannel; challenge_id: string; code: string }) => Promise<void>;
  startGoogleSignIn: (returnTo: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children, service }: { children: ReactNode; service?: AuthService }) {
  const auth = service ?? getAuthService();
  const [state, setState] = useState<{ status: AuthValue["status"]; session: AuthSession | null }>({ status: "loading", session: null });

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
      const session = await auth.verifyOtp(request);
      setState({ status: "authenticated", session });
    },
    [auth],
  );

  const signOut = useCallback(async () => {
    await auth.signOut();
    setState({ status: "anonymous", session: null });
  }, [auth]);

  const value = useMemo<AuthValue>(
    () => ({
      ...state,
      mode: auth.mode,
      requestOtp: (request) => auth.requestOtp(request),
      verifyOtp,
      startGoogleSignIn: (returnTo) => auth.startGoogleSignIn(returnTo),
      signOut,
    }),
    [state, auth, verifyOtp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside AuthProvider");
  return auth;
}
