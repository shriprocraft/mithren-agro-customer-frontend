"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { accountNavItems, activeAccountHref } from "@/components/account/account-nav";
import { useEndDemoSession } from "@/hooks/useEndDemoSession";
import { cn } from "@/lib/utils";

// Sidebar from lg; below lg the same links form one swipeable row of pills, so the mobile account
// pages start with content rather than a long menu.
export function AccountNav() {
  const pathname = usePathname();
  const active = activeAccountHref(pathname);
  const endSession = useEndDemoSession();

  return (
    <nav aria-label="Account">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
        {accountNavItems.map(({ href, label, Icon }) => {
          const isActive = href === active;
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-full border px-4 text-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring lg:rounded-xl lg:border-transparent lg:px-3",
                  isActive ? "border-primary/30 bg-secondary font-semibold text-secondary-foreground" : "border-border text-muted-foreground hover:bg-soft hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-2 lg:border-t lg:border-border lg:pt-2">
          <button
            type="button"
            onClick={endSession}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-full border border-border px-4 text-sm whitespace-nowrap text-muted-foreground outline-none hover:bg-soft hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring lg:rounded-xl lg:border-transparent lg:px-3"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}
