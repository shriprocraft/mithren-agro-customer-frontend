"use client";

import type { ReactNode } from "react";
import { AccountNav } from "@/components/account/AccountNav";
import { useAuth, useBackendCustomerId } from "@/context/AuthContext";

// Frame for every /account page: the signed-in customer's name and the section navigation beside the
// page content. The sign-in gate lives in each page (RequireSignIn), not here, so the page segment always
// renders.
export function AccountShell({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const customerId = useBackendCustomerId();

  // Children are always rendered (each page applies RequireSignIn); the sidebar only when signed in.
  if (!customerId || !session) return <>{children}</>;
  const { full_name, email, phone } = session.customer;
  const name = full_name?.trim() || email || phone || "Your account";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="mb-3 hidden items-center gap-3 lg:flex">
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary font-heading font-semibold text-brand">
            {name.trim().charAt(0).toUpperCase()}
          </span>
          <p className="min-w-0 truncate font-medium">{name}</p>
        </div>
        <p className="mb-3 truncate text-sm font-medium lg:hidden">{name}</p>
        <AccountNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
