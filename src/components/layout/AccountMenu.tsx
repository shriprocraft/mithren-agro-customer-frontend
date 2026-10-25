"use client";

import Link from "next/link";
import { ChevronDown, CircleHelp, Heart, LayoutDashboard, LogIn, LogOut, MapPin, Package, UserRound, type LucideIcon } from "lucide-react";
import { DemoBadge } from "@/components/account/DemoBadge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useOrders } from "@/context/OrdersContext";
import { useEndDemoSession } from "@/hooks/useEndDemoSession";
import { formatPrice } from "@/lib/formatters";
import { orderStatusLabels } from "@/lib/orders";

const accountLinks: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/account", label: "My Account", Icon: LayoutDashboard },
  { href: "/account/orders", label: "My Orders", Icon: Package },
  { href: "/account/addresses", label: "My Addresses", Icon: MapPin },
  { href: "/account/wishlist", label: "My Wishlist", Icon: Heart },
];

const rowClass = "flex min-h-11 items-center gap-2.5 rounded-lg px-2 text-sm font-medium outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring";

// The header's single account control. Signed out (the default): sign in, the demo account, a
// registration preview, and orders saved in this browser, so guests can still get back to them.
// In a demo session: account links and Logout. Real authentication does not exist yet
// (docs/DEMO_ACCOUNT.md). The trigger follows the reference: tinted avatar circle, label, chevron.
export function AccountMenu() {
  const { hydrated, isActive, profile, startDemoSession } = useDemoAccount();
  const { orders, hydrated: ordersReady } = useOrders();
  const endSession = useEndDemoSession();
  const announce = useAnnounce();
  const signedIn = hydrated && isActive;
  const recent = orders.slice(0, 3);

  return (
    <Popover>
      <PopoverTrigger
        aria-label={signedIn ? `Account: ${profile.full_name} (demo)` : "Account: sign in"}
        className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring xl:pr-1"
      >
        <span className="relative grid size-11 place-items-center rounded-full bg-linear-to-b from-white/70 to-secondary text-brand shadow-[inset_0_0_0_1px_rgb(255_255_255/0.85),0_6px_16px_-10px_rgb(var(--shadow-tint)/0.4)]">
          {signedIn ? <span className="font-heading text-base font-semibold" aria-hidden="true">{profile.full_name.trim().charAt(0).toUpperCase() || "D"}</span> : <UserRound className="size-5" aria-hidden="true" />}
        </span>
        <span className="hidden max-w-32 truncate xl:inline" aria-hidden="true">
          {signedIn ? profile.full_name.split(/\s+/)[0] : "Account"}
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground xl:block" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(20rem,calc(100vw-2rem))] gap-3 p-4">
        {signedIn ? (
          <>
            <div>
              <p className="truncate font-heading text-base font-medium">{profile.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
              <DemoBadge className="mt-2" />
            </div>
            <ul className="-mx-2 border-t border-border pt-2">
              {accountLinks.map(({ href, label, Icon }) => (
                <li key={href}>
                  <PopoverClose asChild>
                    <Link href={href} className={rowClass}><Icon className="size-4 text-muted-foreground" aria-hidden="true" />{label}</Link>
                  </PopoverClose>
                </li>
              ))}
              <li>
                <PopoverClose asChild>
                  <button type="button" onClick={endSession} className={`${rowClass} w-full text-left hover:text-destructive`}>
                    <LogOut className="size-4 text-muted-foreground" aria-hidden="true" />Logout
                  </button>
                </PopoverClose>
              </li>
            </ul>
          </>
        ) : (
          <>
            <div>
              <p className="font-heading text-base font-medium">You’re shopping as a guest</p>
              <p className="mt-1 text-sm text-muted-foreground">Customer accounts aren’t live yet. Explore the demo account, or keep shopping without one.</p>
            </div>
            <div className="grid gap-2">
              <PopoverClose asChild>
                <Button asChild>
                  <Link href="/account" onClick={() => { startDemoSession(); announce("Demo account opened. This is sample data."); }}>Explore Demo Account</Link>
                </Button>
              </PopoverClose>
              <PopoverClose asChild>
                <Button asChild variant="outline"><Link href="/login"><LogIn aria-hidden="true" />Sign in</Link></Button>
              </PopoverClose>
            </div>
            <PopoverClose asChild>
              <Link href="/register" className="inline-flex min-h-9 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">New here? Create an account (preview)</Link>
            </PopoverClose>
            <div className="border-t border-border pt-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><Package className="size-4" aria-hidden="true" />Orders in this browser</p>
              {ordersReady && recent.length > 0 ? (
                <ul className="mt-1 divide-y">
                  {recent.map((order) => (
                    <li key={order.id}>
                      <PopoverClose asChild>
                        <Link href={`/orders/${order.id}/tracking`} className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-1 text-sm outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring">
                          <span className="font-mono text-xs">{order.id}</span>
                          <span className="text-right text-xs text-muted-foreground">{orderStatusLabels[order.status]} · {formatPrice(order.total)}</span>
                        </Link>
                      </PopoverClose>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No orders yet.</p>
              )}
            </div>
            <div className="-mx-2 flex flex-wrap border-t border-border pt-2">
              <PopoverClose asChild>
                <Link href="/wishlist" className={rowClass}><Heart className="size-4 text-muted-foreground" aria-hidden="true" />Wishlist</Link>
              </PopoverClose>
              <PopoverClose asChild>
                <Link href="/support" className={rowClass}><CircleHelp className="size-4 text-muted-foreground" aria-hidden="true" />Help</Link>
              </PopoverClose>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
