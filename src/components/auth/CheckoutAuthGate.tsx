"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { DevelopmentAuthNotice } from "@/components/auth/DevelopmentAuthNotice";
import { LoadingState, MessageState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { canPlaceOrder, signInHref } from "@/lib/checkout-auth";

// Wraps every checkout step, so all ways in (cart, mini cart, Buy now, a typed URL, Back) meet the same
// check. A signed-out customer goes to sign-in and returns to this same step. The cart (localStorage)
// and Buy now choice (sessionStorage) are untouched, so nothing is lost. OrdersContext.placeOrder repeats
// the check. Both are customer-journey checks; a real order API must enforce the rule on the server.
export function CheckoutAuthGate({ next, children }: { next: string; children: ReactNode }) {
  const { status, session } = useAuth();
  const router = useRouter();
  const allowed = canPlaceOrder(session);
  const href = signInHref(next);

  useEffect(() => {
    if (status !== "loading" && !allowed) router.replace(href);
  }, [status, allowed, href, router]);

  if (status === "loading") return <LoadingState label="Checking your sign-in…" />;

  if (!allowed) {
    return (
      <MessageState icon={LockKeyhole} title="Sign in to continue" actions={<Button asChild><Link href={href}>Go to sign in</Link></Button>}>
        You need to sign in before placing an order. Your cart is saved.
      </MessageState>
    );
  }

  return (
    <>
      {session?.source === "development_mock" && <DevelopmentAuthNotice className="mb-4" />}
      {children}
    </>
  );
}
