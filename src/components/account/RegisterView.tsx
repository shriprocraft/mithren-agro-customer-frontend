"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { safeNextPath } from "@/lib/checkout-auth";

// There is no separate sign-up: the first sign-in (a mobile or email code, or Google) creates the account
// on the backend, and the sign-in page then asks for the customer's name.
export function RegisterView() {
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  return (
    <div>
      <Heading as="h1" variant="h1" className="text-[1.75rem] sm:text-4xl">Create your account</Heading>
      <p className="mt-2 text-muted-foreground">
        There’s no separate sign-up. Sign in with your mobile number, email or Google: if you’re new, your account is created then, and we’ll ask for your name.
      </p>
      <div className="mt-6">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={next === "/account" ? "/login" : `/login?next=${encodeURIComponent(next)}`}>Go to sign in</Link>
        </Button>
      </div>
    </div>
  );
}
