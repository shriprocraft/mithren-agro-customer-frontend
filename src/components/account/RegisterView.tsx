"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { DemoBadge } from "@/components/account/DemoBadge";
import { ExploreDemoButton } from "@/components/account/ExploreDemoButton";
import { TextField } from "@/components/account/TextField";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { safeNextPath, validateRegistration, type RegistrationInput } from "@/lib/demo-account";
import { cn } from "@/lib/utils";

const EMPTY: RegistrationInput = { full_name: "", email: "", mobile: "", acknowledged: false };

// Registration PREVIEW: shows the sign-up form and its validation, then says plainly that no account
// was created. The details live only in this component's state and are discarded on success; nothing
// is stored or sent. No password is asked for, because nothing could check or protect it.
export function RegisterView() {
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [values, setValues] = useState<RegistrationInput>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);
  const errors = validateRegistration(values);
  const shown = (key: keyof RegistrationInput) => (submitted ? errors[key] : undefined);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const first = Object.keys(errors)[0];
    if (first) {
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setValues(EMPTY); // discard what was typed
    setDone(true);
  };

  if (done) {
    return (
      <div role="status">
        <DemoBadge label="Registration preview" />
        <CircleCheck className="mt-5 size-12 text-success" aria-hidden="true" />
        <Heading as="h1" variant="h1" className="mt-3 text-[1.75rem] sm:text-3xl">That’s how sign-up will work</Heading>
        <p className="mt-2 text-muted-foreground">
          This was a preview: <strong className="font-semibold text-foreground">no account was created</strong>, and the details you entered were not saved or sent anywhere.
          You can explore the demo account to see what an account looks like.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ExploreDemoButton next={next} />
          <Button asChild size="lg" variant="outline"><Link href="/products">Continue shopping</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DemoBadge label="Registration preview" />
      <Heading as="h1" variant="h1" className="mt-4 text-[1.75rem] sm:text-4xl">Create your account</Heading>
      <p className="mt-2 text-muted-foreground">Customer accounts are not live yet. Try the form: nothing you type is saved or sent.</p>

      <form noValidate onSubmit={submit} className="mt-6 grid gap-4">
        {submitted && Object.keys(errors).length > 0 && (
          <p role="alert" className="text-sm text-destructive">Please fix the {Object.keys(errors).length === 1 ? "highlighted field" : `${Object.keys(errors).length} highlighted fields`} below.</p>
        )}
        <TextField name="full_name" label="Full name" autoComplete="name" placeholder="Enter your full name" value={values.full_name} error={shown("full_name")} onChange={(v) => setValues({ ...values, full_name: v })} />
        <TextField name="email" label="Email address" type="email" placeholder="Enter your email address" inputMode="email" autoComplete="email" value={values.email} error={shown("email")} onChange={(v) => setValues({ ...values, email: v })} />
        <TextField name="mobile" label="Mobile number" optional type="tel" placeholder="Enter your 10-digit mobile number" inputMode="tel" autoComplete="tel-national" hint="10 digits, e.g. 98765 43210" value={values.mobile} error={shown("mobile")} onChange={(v) => setValues({ ...values, mobile: v })} />
        <div>
          <label className={cn("flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm has-focus-visible:ring-2 has-focus-visible:ring-ring", shown("acknowledged") ? "border-destructive" : "border-border")}>
            <input
              type="checkbox"
              name="acknowledged"
              checked={values.acknowledged}
              onChange={(e) => setValues({ ...values, acknowledged: e.target.checked })}
              aria-invalid={shown("acknowledged") ? true : undefined}
              aria-describedby={shown("acknowledged") ? "acknowledged-error" : undefined}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span>I understand this is a preview: no account will be created. (Terms and privacy policy will be published before accounts launch.)</span>
          </label>
          {shown("acknowledged") && <p id="acknowledged-error" className="mt-1.5 text-xs text-destructive">{shown("acknowledged")}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full whitespace-normal">Create account (preview)</Button>
      </form>

      <p className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={next === "/account" ? "/login" : `/login?next=${encodeURIComponent(next)}`} className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
