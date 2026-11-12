"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleCheck, Info, ShoppingCart } from "lucide-react";
import { DemoBadge } from "@/components/account/DemoBadge";
import { ExploreDemoButton } from "@/components/account/ExploreDemoButton";
import { DevelopmentAuthNotice } from "@/components/auth/DevelopmentAuthNotice";
import { GoogleLinkStep } from "@/components/auth/GoogleLinkStep";
import { NameStep } from "@/components/auth/NameStep";
import { SignInPanel } from "@/components/auth/SignInPanel";
import { LoadingState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { useAuth } from "@/context/AuthContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useEndDemoSession } from "@/hooks/useEndDemoSession";
import { toAuthErrorCode } from "@/lib/auth-errors";
import { canPlaceOrder } from "@/lib/checkout-auth";
import { safeNextPath } from "@/lib/demo-account";

// The sign-in page. Customer sign-in (a phone code for now) comes first; it is the only thing
// that allows ordering. The demo account stays below as a separate way to look around with sample data.
// ?next= (same-site paths only) is where a signed-in customer returns; ?auth_error= is set by the
// backend when a Google sign-in fails; ?google=verify-email is the email-code step of a first Google
// sign-in; ?signed_out=1 confirms that the demo was left.
export function LoginView() {
  const params = useSearchParams();
  const router = useRouter();
  const rawNext = params.get("next");
  const next = safeNextPath(rawNext, "/");
  const fromCheckout = next.startsWith("/checkout");
  const auth = useAuth();
  const { hydrated, isActive, profile } = useDemoAccount();
  const endSession = useEndDemoSession();
  const authError = params.get("auth_error");
  const demoNext = safeNextPath(fromCheckout ? null : rawNext);
  const registerHref = demoNext === "/account" ? "/register" : `/register?next=${encodeURIComponent(demoNext)}`;
  const signedIn = canPlaceOrder(auth.session);
  const signInReturn = `/login?next=${encodeURIComponent(next)}`;
  const googleStep = params.get("google") === "verify-email" && auth.mode === "backend";

  // Only an explicit destination redirects, so opening /login while signed in shows the panel below.
  // A new customer without a name is asked for one first (NameStep refreshes the session when done).
  const onboarding = signedIn && auth.needsName;
  useEffect(() => {
    if (signedIn && !onboarding && rawNext) router.replace(next);
  }, [signedIn, onboarding, rawNext, next, router]);

  if (auth.status === "loading") return <LoadingState label="Checking your sign-in…" />;
  if (signedIn && !onboarding && rawNext) return <LoadingState label="Taking you back…" />;

  return (
    <div>
      <Heading as="h1" variant="h1" className="text-[1.75rem] sm:text-4xl">{fromCheckout ? "Sign in to place your order" : "Welcome to Mithren Agro"}</Heading>
      <p className="mt-2 text-muted-foreground">
        {fromCheckout ? "You’ll come straight back to checkout." : "Browse and fill your cart freely. You’ll need to sign in before placing an order."}
      </p>

      {fromCheckout && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
          <ShoppingCart className="size-4 shrink-0" aria-hidden="true" /> Your cart is saved.
        </p>
      )}

      {params.get("signed_out") === "1" && !isActive && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
          <CircleCheck className="size-4 shrink-0" aria-hidden="true" /> You have left the demo account. Sample orders and the sample address were removed.
        </p>
      )}

      {auth.mode === "development_mock" && <DevelopmentAuthNotice className="mt-4" />}
      {auth.mode === "unavailable" && (
        <p role="note" className="mt-4 flex gap-2 rounded-2xl border border-highlight bg-highlight/25 p-3 text-sm leading-relaxed text-foreground/85">
          <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          Sign-in isn’t connected on this site yet, so orders can’t be placed for now. You can still browse and fill your cart, and it will be kept here.
        </p>
      )}

      <div className="mt-6">
        {onboarding ? (
          <NameStep />
        ) : signedIn ? (
          <div className="rounded-2xl border border-border p-5">
            <p className="font-medium">You’re signed in as {auth.session?.customer.full_name ?? auth.session?.customer.email ?? auth.session?.customer.phone}.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href="/products">Continue shopping</Link></Button>
              <Button size="lg" variant="outline" onClick={() => void auth.signOut()}>Sign out</Button>
            </div>
          </div>
        ) : googleStep ? (
          <GoogleLinkStep returnTo={signInReturn} onCancel={() => router.replace(signInReturn)} />
        ) : (
          <SignInPanel returnTo={signInReturn} initialError={authError ? toAuthErrorCode(authError) : undefined} />
        )}
      </div>

      <section aria-labelledby="demo-title" className="mt-8 border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="demo-title" className="font-heading text-base font-semibold">Just looking around?</h2>
          <DemoBadge />
        </div>
        {hydrated && isActive ? (
          <div className="mt-3">
            <p className="text-sm font-medium">You are exploring the demo account as {profile.full_name}.</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline"><Link href={demoNext}>Go to my account</Link></Button>
              <Button variant="outline" onClick={endSession}>Logout</Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              A sample account with example orders, an address and settings. It isn’t a real sign-in and can’t place orders. No password is needed and nothing is sent to a server.
            </p>
            <ExploreDemoButton next={demoNext} className="w-full sm:w-full" />
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-col gap-1 border-t border-border pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        {auth.mode === "backend" ? (
          <p className="text-muted-foreground">New here? Signing in with your mobile number, email or Google creates your account.</p>
        ) : (
          <p className="text-muted-foreground">
            New here?{" "}
            <Link href={registerHref} className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline">Create an account (preview)</Link>
          </p>
        )}
        <Link href="/products" className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline">Continue as guest</Link>
      </div>
    </div>
  );
}
