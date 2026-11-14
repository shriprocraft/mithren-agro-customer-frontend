"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { LoadingState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { useAuth, useBackendCustomerId } from "@/context/AuthContext";
import { signInHref } from "@/lib/checkout-auth";

// Wraps the content of every /account page. Without a signed-in customer it shows a sign-in screen in
// place of the account (no redirect, so no loops, and the address bar keeps the destination). It sits in
// each page rather than the layout so the page segment always renders (Next.js instant-navigation
// validation). A user-experience gate only: the API authorises every account request itself.
export function RequireSignIn({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, mode } = useAuth();
  const customerId = useBackendCustomerId();

  if (customerId) return <>{children}</>;
  if (status === "loading") return <LoadingState label="Loading your account…" fullHeight />;

  const unavailable = mode === "unavailable";
  return (
    <section aria-labelledby="gate-title" className="surface-card mx-auto flex max-w-xl flex-col items-center rounded-3xl px-6 py-10 text-center sm:px-10">
      <span className="grid size-14 place-items-center rounded-full bg-secondary text-brand">
        <LockKeyhole className="size-6" aria-hidden="true" />
      </span>
      <h1 id="gate-title" className="mt-4 font-heading text-2xl font-semibold">
        {unavailable ? "Sign-in isn’t available right now" : "Sign in to see your account"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {unavailable
          ? "The store’s account service isn’t connected, so accounts can’t be opened. Please try again later."
          : "Signing in gives you your profile, saved addresses, orders and wishlist."}
      </p>
      <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {!unavailable && (
          <Button asChild size="lg">
            <Link href={signInHref(pathname)}>Go to sign in</Link>
          </Button>
        )}
      </div>
      <Link href="/products" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">
        Continue shopping as a guest
      </Link>
    </section>
  );
}
