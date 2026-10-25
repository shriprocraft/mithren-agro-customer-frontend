"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleCheck, Info } from "lucide-react";
import { DemoBadge } from "@/components/account/DemoBadge";
import { ExploreDemoButton } from "@/components/account/ExploreDemoButton";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useEndDemoSession } from "@/hooks/useEndDemoSession";
import { safeNextPath } from "@/lib/demo-account";

// Sign-in page for the DEMO. There is deliberately no password form: no account service exists, so a
// form would only pretend to check credentials. "Explore Demo Account" opens the sample account, and
// guests can keep shopping. ?next= (same-site paths only) is where the demo opens; ?signed_out=1
// confirms that the demo was left.
export function LoginView() {
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const { hydrated, isActive, profile } = useDemoAccount();
  const endSession = useEndDemoSession();
  const registerHref = next === "/account" ? "/register" : `/register?next=${encodeURIComponent(next)}`;

  return (
    <div>
      <DemoBadge />
      <Heading as="h1" variant="h1" className="mt-4 text-[1.75rem] sm:text-4xl">Welcome to Mithren Agro</Heading>
      <p className="mt-2 text-muted-foreground">Sign in to see your orders, saved addresses and wishlist.</p>

      {params.get("signed_out") === "1" && !isActive && (
        <p role="status" className="mt-5 flex items-center gap-2 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
          <CircleCheck className="size-4 shrink-0" aria-hidden="true" /> You have left the demo account. Sample orders and the sample address were removed.
        </p>
      )}

      {hydrated && isActive ? (
        <div className="mt-6 rounded-2xl border border-border p-5">
          <p className="font-medium">You are exploring the demo account as {profile.full_name}.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link href={next}>Go to my account</Link></Button>
            <Button size="lg" variant="outline" onClick={endSession}>Logout</Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <ExploreDemoButton next={next} className="w-full sm:w-full" />
          <p className="text-sm text-muted-foreground">
            Opens a sample account with example orders, an address and settings. No password is needed and nothing is sent to a server.
          </p>
        </div>
      )}

      <p className="mt-6 flex gap-2 rounded-2xl bg-soft p-3 text-xs leading-relaxed text-muted-foreground ring-1 ring-border">
        <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
        Real customer sign-in (with email or mobile number) is not available yet. It will arrive with customer accounts; until then, please don’t enter a real password anywhere on this preview.
      </p>

      <div className="mt-6 flex flex-col gap-1 border-t border-border pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          New here?{" "}
          <Link href={registerHref} className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline">Create an account (preview)</Link>
        </p>
        <Link href="/products" className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline">Continue as guest</Link>
      </div>
    </div>
  );
}
