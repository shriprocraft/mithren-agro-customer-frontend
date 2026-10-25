"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useDemoAccount } from "@/context/DemoAccountContext";

/** Shown on public pages reached from the account menu (Help & Support), only during a demo session. */
export function BackToAccountLink() {
  const { hydrated, isActive } = useDemoAccount();
  if (!hydrated || !isActive) return null;
  return (
    <Link href="/account" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" /> Back to my account
    </Link>
  );
}
