"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CircleAlert, MailCheck } from "lucide-react";
import { LoadingState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useAuth } from "@/context/AuthContext";
import { AuthError, authErrorMessage } from "@/lib/auth-errors";
import type { AuthErrorCode, GoogleLinkStatus } from "@/types/auth";

const codeOf = (error: unknown): AuthErrorCode => (error instanceof AuthError ? error.code : "unknown");
const waitOf = (error: unknown): number => (error instanceof AuthError && error.retryAfterSeconds ? error.retryAfterSeconds : 0);
// Errors after which this Google sign-in can't continue: only starting again (or another method) helps.
const FINAL: AuthErrorCode[] = ["google_link_failed", "link_not_found"];

// The first time a Google account is used here, the backend emails a code to its address (rule E1).
// Entering it links Google to the account, or creates the account; it never signs in by itself, so the
// browser then goes through Google once more, which now signs the customer in.
export function GoogleLinkStep({ returnTo, onCancel }: { returnTo: string; onCancel: () => void }) {
  const auth = useAuth();
  const announce = useAnnounce();
  const [status, setStatus] = useState<GoogleLinkStatus | null>(null);
  const [error, setError] = useState<{ code: AuthErrorCode; wait?: number } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [linked, setLinked] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  // The deadline and the displayed time come from one clock reading, so a zero wait never shows as "1s".
  const restartClock = (seconds: number) => {
    const at = Date.now();
    setNow(at);
    setResendAt(at + seconds * 1000);
  };

  useEffect(() => {
    let live = true;
    auth.getGoogleLink().then(
      (next) => {
        if (!live) return;
        setStatus(next);
        restartClock(next.resend_after_seconds);
      },
      (e) => live && setError({ code: codeOf(e) }),
    );
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [auth]);

  const cooldown = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const finalError = error && FINAL.includes(error.code);

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^[0-9]{6}$/.test(code)) return setError({ code: "invalid_otp" });
    setBusy(true);
    setError(null);
    try {
      await auth.verifyGoogleLink(code);
      setLinked(true);
      announce("Email confirmed. Finishing your Google sign-in.");
      // Linked: a normal Google sign-in now signs the customer in.
      await auth.startGoogleSignIn(returnTo);
    } catch (e) {
      setError({ code: codeOf(e) });
      setLinked(false);
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const resend = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await auth.resendGoogleLink();
      setStatus(next);
      setCode("");
      restartClock(next.resend_after_seconds);
      announce("A new code has been sent.");
    } catch (e) {
      const wait = waitOf(e);
      setError({ code: codeOf(e), wait });
      if (wait) restartClock(wait);
    } finally {
      setBusy(false);
    }
  };

  const back = (
    <Button type="button" variant="ghost" className="justify-self-start" onClick={onCancel}>
      <ArrowLeft aria-hidden="true" /> Use another way to sign in
    </Button>
  );

  if (!status && !error) return <LoadingState label="Loading your Google sign-in…" />;
  if (linked) return <LoadingState label="Email confirmed. Finishing your Google sign-in…" />;

  return (
    <div className="grid gap-4">
      <div className="flex gap-3 rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
        <MailCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-base font-semibold">Confirm your email</h2>
          {status ? (
            <p className="mt-1">
              {status.delivered && status.challenge_id
                ? <>We sent a 6-digit code to <span className="font-medium">{status.destination_hint}</span>, the email on your Google account. Enter it to finish signing in with Google.</>
                : <>We couldn’t send the code to <span className="font-medium">{status.destination_hint}</span>. Send a new one to continue.</>}
            </p>
          ) : (
            <p className="mt-1">This step confirms the email on your Google account before it’s connected.</p>
          )}
        </div>
      </div>

      {status && !finalError && (
        <form noValidate onSubmit={verify} aria-label="Confirm your Google email" className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="google-link-code">Email code</Label>
            <Input
              ref={inputRef}
              id="google-link-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              disabled={!status.challenge_id || busy}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              aria-invalid={error?.code === "invalid_otp" || undefined}
            />
          </div>
          <Button type="submit" size="lg" loading={busy} disabled={!status.challenge_id}>Confirm and continue</Button>
          <Button type="button" variant="outline" disabled={busy || cooldown > 0} onClick={() => void resend()}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </Button>
        </form>
      )}

      {error && (
        <p role="alert" className="flex gap-2 text-sm font-medium text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {authErrorMessage(error.code, { retryAfterSeconds: error.wait, context: "email" })}
        </p>
      )}
      {back}
    </div>
  );
}
