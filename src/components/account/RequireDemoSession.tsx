"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { ExploreDemoButton } from "@/components/account/ExploreDemoButton";
import { LoadingState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { useDemoAccount } from "@/context/DemoAccountContext";

// Wraps the content of every /account page. Without a demo session it shows an entry screen in place
// of the account (no redirect, so no loops, and the address bar keeps the destination). It sits in
// each page rather than the layout so the page segment always renders (Next.js instant-navigation
// validation). A user-experience gate only: the demo flag lives in the browser and proves nothing.
export function RequireDemoSession({ children }: { children: ReactNode }) {
  const { hydrated, isActive } = useDemoAccount();
  const pathname = usePathname();

  if (!hydrated) return <LoadingState label="Loading your account…" fullHeight />;

  if (!isActive) {
    return (
      <section aria-labelledby="gate-title" className="surface-card mx-auto flex max-w-xl flex-col items-center rounded-3xl px-6 py-10 text-center sm:px-10">
        <span className="grid size-14 place-items-center rounded-full bg-secondary text-brand">
          <LockKeyhole className="size-6" aria-hidden="true" />
        </span>
        <h1 id="gate-title" className="mt-4 font-heading text-2xl font-semibold">Sign in to see your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Customer accounts are not live yet. Explore the demo account to see orders, addresses and settings with sample data.
        </p>
        <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ExploreDemoButton />
          <Button asChild size="lg" variant="outline">
            <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Go to sign in</Link>
          </Button>
        </div>
        <Link href="/products" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">
          Continue shopping as a guest
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
