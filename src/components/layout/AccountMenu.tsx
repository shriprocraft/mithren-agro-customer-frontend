"use client";

import { ChevronDown, UserRound } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Authentication is out of scope for this phase; the menu says so instead of linking to a missing page.
// Trigger follows the reference: tinted glass avatar circle, then the label and a chevron.
export function AccountMenu() {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Account"
        className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring xl:pr-1"
      >
        <span className="grid size-11 place-items-center rounded-full bg-linear-to-b from-white/70 to-secondary text-brand shadow-[inset_0_0_0_1px_rgb(255_255_255/0.85),0_6px_16px_-10px_rgb(var(--shadow-tint)/0.4)]">
          <UserRound className="size-5" aria-hidden="true" />
        </span>
        <span className="hidden xl:inline" aria-hidden="true">
          Account
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground xl:block" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 gap-2 p-4">
        <p className="font-heading text-base font-medium">Accounts are coming soon</p>
        <p className="text-sm text-muted-foreground">
          Sign-in, order history and saved addresses will arrive in a later release. Nothing in this preview is saved to an
          account.
        </p>
      </PopoverContent>
    </Popover>
  );
}
