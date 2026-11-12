"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CircleAlert, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFeatures } from "@/config/auth";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useAuth } from "@/context/AuthContext";
import { normalizeMobile } from "@/lib/address";
import { AuthError, authErrorMessage } from "@/lib/auth-errors";
import { isValidEmail } from "@/lib/demo-account";
import { cn } from "@/lib/utils";
import type { AuthErrorCode, OtpChallenge, OtpChannel } from "@/types/auth";

const codeOf = (error: unknown): AuthErrorCode => (error instanceof AuthError ? error.code : "unknown");
const waitOf = (error: unknown): number => (error instanceof AuthError && error.retryAfterSeconds ? error.retryAfterSeconds : 0);

/** Channels offered; only the ones whose backend flow exists (config/auth.ts). */
const CHANNELS = ([["phone", "Phone", Smartphone], ["email", "Email", Mail]] as const).filter(
  ([value]) => value === "phone" || authFeatures.emailOtp,
);

/** The current time, updated once a second, and a way to read it again at once (after setting a deadline). */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return [now, () => setNow(Date.now())] as const;
}

/** Whole seconds from `now` until `deadline` (a Date.now() value), never negative. */
const secondsUntil = (deadline: number, now: number) => Math.max(0, Math.ceil((deadline - now) / 1000));

// Sign-in by a one-time code (phone or email) or with Google (backend only). It holds a typed code only
// in this component's memory until it is submitted, and it never decides that anyone is signed in:
// AuthContext does, from the backend's session.
export function SignInPanel({ returnTo, initialError }: { returnTo: string; initialError?: AuthErrorCode }) {
  const auth = useAuth();
  const [channel, setChannel] = useState<OtpChannel>("phone");
  const [destination, setDestination] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<{ code: AuthErrorCode; context?: "google" | "email" } | null>(
    initialError ? { code: initialError, context: "google" } : null,
  );
  const [sending, setSending] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [sentTo, setSentTo] = useState("");
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, refreshNow] = useNow();
  const wait = secondsUntil(waitUntil, now);
  const unavailable = auth.mode === "unavailable";
  // Google signs people in only through the backend; the development mock never pretends to.
  const googleOffered = authFeatures.googleSignIn && auth.mode === "backend";
  // A rate limit's message goes once its wait is over.
  const shownFormError = formError && !(formError.code === "rate_limited" && wait === 0) ? formError : null;

  const switchChannel = (next: OtpChannel) => {
    setChannel(next);
    setDestination("");
    setFieldError(null);
    setFormError(null);
  };

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (wait > 0) return;
    setFormError(null);
    let normalized: string | null;
    if (channel === "phone") {
      const mobile = normalizeMobile(destination);
      normalized = mobile && `+91${mobile}`;
      if (!normalized) return setFieldError("Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.");
    } else {
      normalized = isValidEmail(destination) ? destination.trim().toLowerCase() : null;
      if (!normalized) return setFieldError("Enter an email address like name@example.com.");
    }
    setFieldError(null);
    setSending(true);
    try {
      setChallenge(await auth.requestOtp({ channel, destination: normalized }));
      setSentTo(normalized);
    } catch (error) {
      const code = codeOf(error);
      const context = channel === "email" ? "email" : undefined;
      if (code === "invalid_destination") setFieldError(authErrorMessage(code, { context }));
      else setFormError({ code, ...(context && { context }) });
      if (code === "rate_limited") {
        setWaitUntil(Date.now() + (waitOf(error) || 30) * 1000);
        refreshNow();
      }
    } finally {
      setSending(false);
    }
  };

  const google = async () => {
    if (!googleOffered) return;
    setFormError(null);
    setGoogleBusy(true);
    try {
      // On success the browser leaves for Google. Being signed in is decided later, by the session check.
      await auth.startGoogleSignIn(returnTo);
    } catch (error) {
      setFormError({ code: codeOf(error), context: "google" });
      setGoogleBusy(false);
    }
  };

  if (challenge) {
    return <OtpStep challenge={challenge} destination={sentTo} onChallenge={setChallenge} onBack={() => setChallenge(null)} />;
  }

  return (
    <div className="grid gap-5">
      {googleOffered ? (
        <Button type="button" variant="outline" size="lg" className="w-full" disabled={unavailable} loading={googleBusy} onClick={google}>
          Continue with Google
        </Button>
      ) : (
        // Shown so customers know it's planned; disabled, with no handler, so it can't start anything.
        <Button type="button" variant="outline" size="lg" className="w-full" disabled aria-describedby="google-coming-soon">
          Continue with Google
          <span id="google-coming-soon" className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">Coming soon</span>
        </Button>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />or get a one-time code<span className="h-px flex-1 bg-border" />
      </div>

      <form noValidate onSubmit={send} aria-label="Sign in with a one-time code" className="grid gap-4">
        {CHANNELS.length > 1 && (
          <div role="radiogroup" aria-label="Where to send your code" className="grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
            {CHANNELS.map(([value, label, Icon]) => (
              <label key={value} className={cn("flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring", channel === value ? "bg-card text-foreground shadow-[var(--elevation-card)]" : "text-muted-foreground hover:text-foreground")}>
                <input type="radio" name="otp-channel" value={value} checked={channel === value} disabled={unavailable} onChange={() => switchChannel(value)} className="sr-only" />
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </label>
            ))}
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="sign-in-destination">{channel === "phone" ? "Mobile number" : "Email address"}</Label>
          <Input
            key={channel}
            id="sign-in-destination"
            type={channel === "phone" ? "tel" : "email"}
            inputMode={channel === "phone" ? "tel" : "email"}
            autoComplete={channel === "phone" ? "tel-national" : "email"}
            placeholder={channel === "phone" ? "10-digit mobile number" : "name@example.com"}
            value={destination}
            disabled={unavailable}
            onChange={(event) => setDestination(event.target.value)}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? "sign-in-destination-error" : undefined}
            className="h-11"
          />
          {fieldError && <p id="sign-in-destination-error" className="text-xs text-destructive">{fieldError}</p>}
        </div>

        {shownFormError && <ErrorLine code={shownFormError.code} context={shownFormError.context} retryAfterSeconds={wait} />}
        <Button type="submit" size="lg" className="w-full" disabled={unavailable || wait > 0} loading={sending}>
          {sending ? "Sending code…" : wait > 0 ? `Send code (wait ${wait}s)` : "Send code"}
        </Button>
      </form>
    </div>
  );
}

function OtpStep({ challenge, destination, onChallenge, onBack }: { challenge: OtpChallenge; destination: string; onChallenge: (challenge: OtpChallenge) => void; onBack: () => void }) {
  const auth = useAuth();
  const announce = useAnnounce();
  const [code, setCode] = useState("");
  const [error, setError] = useState<AuthErrorCode | null>(null);
  const [invalidFormat, setInvalidFormat] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [now, refreshNow] = useNow();
  // Both deadlines start from the clock the countdown reads, so a fresh code shows its full time (5:00,
  // not 5:01 when a millisecond passes between the two readings).
  const [cooldownUntil, setCooldownUntil] = useState(() => now + challenge.resend_after_seconds * 1000);
  // The server decides expiry; this only stops the customer typing a code that can no longer work.
  const [expiresAt, setExpiresAt] = useState(() => now + challenge.expires_in_seconds * 1000);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [challenge.challenge_id]);

  const expiresIn = secondsUntil(expiresAt, now);
  const expiredLocally = expiresIn === 0;
  // An expired, exhausted or already-used code can't be retried, so a new one may be requested straight away.
  const needsNewCode = expiredLocally || error === "expired_otp" || error === "too_many_attempts" || error === "sign_in_not_confirmed";
  const cooldown = needsNewCode && error !== "rate_limited" ? 0 : secondsUntil(cooldownUntil, now);
  const counting = cooldown > 0;
  const shownError: AuthErrorCode | null = error ?? (expiredLocally ? "expired_otp" : null);

  const startCooldown = (seconds: number) => {
    setCooldownUntil(Date.now() + seconds * 1000);
    refreshNow();
  };

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (needsNewCode) return;
    setError(null);
    if (!/^[0-9]{6}$/.test(code)) {
      setInvalidFormat(true);
      inputRef.current?.focus();
      return;
    }
    setInvalidFormat(false);
    setBusy(true);
    try {
      await auth.verifyOtp({ channel: challenge.channel, challenge_id: challenge.challenge_id, code });
      announce("You are signed in.");
    } catch (failure) {
      const failed = codeOf(failure);
      setError(failed);
      setCode("");
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const resend = async () => {
    setResending(true);
    setError(null);
    try {
      const next = await auth.requestOtp({ channel: challenge.channel, destination });
      onChallenge(next);
      setCode("");
      setExpiresAt(Date.now() + next.expires_in_seconds * 1000);
      startCooldown(next.resend_after_seconds);
      announce("A new code has been sent.");
    } catch (failure) {
      setError(codeOf(failure));
      const wait = waitOf(failure);
      if (wait) startCooldown(wait);
    } finally {
      setResending(false);
    }
  };

  const minutes = Math.floor(expiresIn / 60);
  const seconds = String(expiresIn % 60).padStart(2, "0");

  return (
    <form noValidate onSubmit={verify} aria-label="Enter your one-time code" className="grid gap-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">Enter the 6-digit code</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {challenge.development_code ? "Generated for" : "Sent to"} <span className="font-medium text-foreground">{challenge.destination_hint}</span>
        </p>
        {!expiredLocally && (
          <p className="mt-1 text-xs text-muted-foreground" data-testid="code-expiry">
            Code expires in {minutes}:{seconds}
          </p>
        )}
      </div>

      {challenge.development_code && (
        <p role="note" className="rounded-2xl border border-highlight bg-highlight/25 p-3 text-xs leading-relaxed text-foreground/85">
          Development mock: no message was sent. Code for this attempt: <strong data-testid="development-code" className="font-mono text-sm font-semibold">{challenge.development_code}</strong>
        </p>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="sign-in-code">One-time code</Label>
        <Input
          ref={inputRef}
          id="sign-in-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          disabled={needsNewCode}
          onChange={(event) => {
            setCode(event.target.value.replace(/[^0-9]/g, ""));
            setInvalidFormat(false);
          }}
          aria-invalid={invalidFormat || error === "invalid_otp" ? true : undefined}
          aria-describedby={invalidFormat ? "sign-in-code-error" : undefined}
          className="h-12 text-center font-mono text-lg tracking-[0.4em]"
        />
        {invalidFormat && <p id="sign-in-code-error" className="text-xs text-destructive">Enter all 6 digits of the code.</p>}
      </div>

      {shownError && <ErrorLine code={shownError} retryAfterSeconds={cooldown} />}

      <Button type="submit" size="lg" className="w-full" disabled={needsNewCode} loading={busy}>
        {busy ? "Verifying…" : "Verify and continue"}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Button type="button" variant="ghost" onClick={onBack} className="px-2">
          <ArrowLeft aria-hidden="true" />
          Use a different {challenge.channel === "phone" ? "number" : "email"}
        </Button>
        <Button type="button" variant="ghost" disabled={counting} loading={resending} onClick={resend} className="px-2">
          {counting ? `Resend code in ${cooldown}s` : "Resend code"}
        </Button>
      </div>
    </form>
  );
}

function ErrorLine({ code, context, retryAfterSeconds }: { code: AuthErrorCode; context?: "google" | "email"; retryAfterSeconds?: number }) {
  return (
    <p role="alert" className="flex gap-2 text-sm font-medium text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {authErrorMessage(code, { context, retryAfterSeconds })}
    </p>
  );
}
