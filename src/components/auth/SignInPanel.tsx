"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CircleAlert, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useAuth } from "@/context/AuthContext";
import { normalizeMobile } from "@/lib/address";
import { AuthError, authErrorMessage } from "@/lib/auth-errors";
import { isValidEmail } from "@/lib/demo-account";
import { cn } from "@/lib/utils";
import type { AuthErrorCode, OtpChallenge, OtpChannel } from "@/types/auth";

const codeOf = (error: unknown): AuthErrorCode => (error instanceof AuthError ? error.code : "unknown");

// Google, phone OTP and email OTP. It holds a typed code only in this component's memory until it is
// submitted, and it never decides that anyone is signed in: AuthContext does, from the adapter's answer.
export function SignInPanel({ returnTo, initialError }: { returnTo: string; initialError?: AuthErrorCode }) {
  const auth = useAuth();
  const [channel, setChannel] = useState<OtpChannel>("phone");
  const [destination, setDestination] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<AuthErrorCode | null>(initialError ?? null);
  const [sending, setSending] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [sentTo, setSentTo] = useState("");
  const unavailable = auth.mode === "unavailable";

  const switchChannel = (next: OtpChannel) => {
    setChannel(next);
    setDestination("");
    setFieldError(null);
    setFormError(null);
  };

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      setFormError(codeOf(error));
    } finally {
      setSending(false);
    }
  };

  const google = async () => {
    setFormError(null);
    setGoogleBusy(true);
    try {
      // On success the browser leaves for Google. Being signed in is decided later, by the session check.
      await auth.startGoogleSignIn(returnTo);
    } catch (error) {
      setFormError(codeOf(error));
      setGoogleBusy(false);
    }
  };

  if (challenge) {
    return <OtpStep challenge={challenge} destination={sentTo} onChallenge={setChallenge} onBack={() => setChallenge(null)} />;
  }

  return (
    <div className="grid gap-5">
      <Button type="button" variant="outline" size="lg" className="w-full" disabled={unavailable} loading={googleBusy} onClick={google}>
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />or get a one-time code<span className="h-px flex-1 bg-border" />
      </div>

      <form noValidate onSubmit={send} aria-label="Sign in with a one-time code" className="grid gap-4">
        <div role="radiogroup" aria-label="Where to send your code" className="grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
          {([["phone", "Phone", Smartphone], ["email", "Email", Mail]] as const).map(([value, label, Icon]) => (
            <label key={value} className={cn("flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring", channel === value ? "bg-card text-foreground shadow-[var(--elevation-card)]" : "text-muted-foreground hover:text-foreground")}>
              <input type="radio" name="otp-channel" value={value} checked={channel === value} disabled={unavailable} onChange={() => switchChannel(value)} className="sr-only" />
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </label>
          ))}
        </div>

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

        {formError && <ErrorLine code={formError} />}
        <Button type="submit" size="lg" className="w-full" disabled={unavailable} loading={sending}>
          {sending ? "Sending code…" : "Send code"}
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
  const [cooldown, setCooldown] = useState(challenge.resend_after_seconds);
  const inputRef = useRef<HTMLInputElement>(null);
  const counting = cooldown > 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, [challenge.challenge_id]);

  useEffect(() => {
    if (!counting) return;
    const timer = setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [counting]);

  // An expired or exhausted code can't be retried, so a new one may be requested straight away.
  const needsNewCode = error === "expired_otp" || error === "too_many_attempts";

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) {
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
      if (failed === "expired_otp" || failed === "too_many_attempts") setCooldown(0);
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
      setCooldown(next.resend_after_seconds);
      announce("A new code has been sent.");
    } catch (failure) {
      setError(codeOf(failure));
      if (failure instanceof AuthError && failure.retryAfterSeconds) setCooldown(failure.retryAfterSeconds);
    } finally {
      setResending(false);
    }
  };

  return (
    <form noValidate onSubmit={verify} aria-label="Enter your one-time code" className="grid gap-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">Enter the 6-digit code</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {challenge.development_code ? "Generated for" : "Sent to"} <span className="font-medium text-foreground">{challenge.destination_hint}</span>
        </p>
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
            setCode(event.target.value.replace(/\D/g, ""));
            setInvalidFormat(false);
          }}
          aria-invalid={invalidFormat || error === "invalid_otp" ? true : undefined}
          aria-describedby={invalidFormat ? "sign-in-code-error" : undefined}
          className="h-12 text-center font-mono text-lg tracking-[0.4em]"
        />
        {invalidFormat && <p id="sign-in-code-error" className="text-xs text-destructive">Enter all 6 digits of the code.</p>}
      </div>

      {error && <ErrorLine code={error} />}

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

function ErrorLine({ code }: { code: AuthErrorCode }) {
  return (
    <p role="alert" className="flex gap-2 text-sm font-medium text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {authErrorMessage(code)}
    </p>
  );
}
