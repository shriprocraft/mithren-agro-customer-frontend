"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useBackendCustomerId } from "@/context/AuthContext";

/** Shown on public pages reached from the account menu (Help & Support), only when signed in. */
export function BackToAccountLink() {
  if (!useBackendCustomerId()) return null;
  return (
    <Link href="/account" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" /> Back to my account
    </Link>
  );
}
