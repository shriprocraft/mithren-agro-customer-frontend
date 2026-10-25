"use client";

import type { ReactNode } from "react";
import { AccountNav } from "@/components/account/AccountNav";
import { DemoBadge } from "@/components/account/DemoBadge";
import { useDemoAccount } from "@/context/DemoAccountContext";

// Frame for every /account page: profile summary and section navigation beside the page content.
// The sign-in gate lives in each page (RequireDemoSession), not here, so the page segment always renders.
export function AccountShell({ children }: { children: ReactNode }) {
  const { hydrated, isActive, profile } = useDemoAccount();

  // Children are always rendered (each page applies RequireDemoSession); the sidebar only in a session.
  if (!hydrated || !isActive) return <>{children}</>;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="mb-3 hidden items-center gap-3 lg:flex">
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary font-heading font-semibold text-brand">
            {profile.full_name.trim().charAt(0).toUpperCase() || "D"}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{profile.full_name}</p>
            <DemoBadge className="mt-0.5" />
          </div>
        </div>
        <p className="mb-3 flex items-center justify-between gap-3 text-sm lg:hidden">
          <span className="min-w-0 truncate font-medium">{profile.full_name}</span>
          <DemoBadge className="shrink-0" />
        </p>
        <AccountNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
