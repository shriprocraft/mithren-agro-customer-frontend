"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, CircleHelp, Heart, LayoutDashboard, LogIn, LogOut, MapPin, Package, Truck, UserRound, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth, useBackendCustomerId } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { formatPrice } from "@/lib/formatters";
import { orderStatusLabels } from "@/lib/orders";

const accountLinks: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/account", label: "My Account", Icon: LayoutDashboard },
  { href: "/account/profile", label: "My Profile", Icon: UserRound },
  { href: "/account/orders", label: "My Orders", Icon: Package },
  { href: "/account/track", label: "Track Orders", Icon: Truck },
  { href: "/account/addresses", label: "My Addresses", Icon: MapPin },
  { href: "/account/wishlist", label: "My Wishlist", Icon: Heart },
];

const rowClass = "flex min-h-11 items-center gap-2.5 rounded-lg px-2 text-sm font-medium outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring";

// The header's single account control. Signed out: sign in (which also creates an account), the wishlist
// and help. Signed in through the backend: who they are, the account sections, their latest orders and
// Sign out. The trigger follows the reference: tinted avatar circle, label, chevron.
export function AccountMenu() {
  const auth = useAuth();
  const signedIn = Boolean(useBackendCustomerId());
  const { orders, hydrated: ordersReady } = useOrders();
  const customer = signedIn ? auth.session?.customer : undefined;
  const customerName = customer ? (customer.full_name ?? customer.phone ?? customer.email ?? "customer") : null;
  const recent = orders.slice(0, 3);

  return (
    <Popover>
      <PopoverTrigger
        aria-label={customerName ? `Account: signed in as ${customerName}` : "Account: sign in"}
        className="inline-flex h-11 items-center gap-2 rounded-full p-1 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring sm:pr-3"
      >
        <span className="relative grid size-9 place-items-center rounded-full bg-linear-to-b from-white/70 to-secondary text-brand shadow-[inset_0_0_0_1px_rgb(255_255_255/0.85),0_6px_16px_-10px_rgb(var(--shadow-tint)/0.4)]">
          {customerName ? (
            <span className="font-heading text-base font-semibold" aria-hidden="true">{customerName.trim().charAt(0).toUpperCase()}</span>
          ) : (
            <UserRound className="size-5" aria-hidden="true" />
          )}
        </span>
        <span className="hidden max-w-28 truncate sm:inline" aria-hidden="true">
          {customer?.full_name ? customer.full_name.split(/\s+/)[0] : "Account"}
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(20rem,calc(100vw-2rem))] gap-3 p-4">
        {customer ? (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="truncate font-heading text-base font-medium">{customerName}</p>
            </div>
            <ul aria-label="Your account" className="-mx-2 border-t border-border pt-2">
              {accountLinks.map(({ href, label, Icon }) => (
                <li key={href}>
                  <PopoverClose asChild>
                    <Link href={href} className={rowClass}><Icon className="size-4 text-muted-foreground" aria-hidden="true" />{label}</Link>
                  </PopoverClose>
                </li>
              ))}
            </ul>
            <div className="border-t border-border pt-3">
              <PopoverClose asChild>
                <Link href="/account/orders" className="-mx-1 flex min-h-11 items-center justify-between gap-2 rounded-lg px-1 text-sm font-semibold outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring">
                  <span>Latest orders</span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              </PopoverClose>
              {!ordersReady ? (
                <p className="mt-1 text-sm text-muted-foreground">Loading…</p>
              ) : recent.length > 0 ? (
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
            <PopoverClose asChild>
              <Button type="button" variant="outline" className="w-full" onClick={() => void auth.signOut()}>
                <LogOut aria-hidden="true" />Sign out
              </Button>
            </PopoverClose>
          </>
        ) : (
          <>
            <div>
              <p className="font-heading text-base font-medium">You’re shopping as a guest</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {auth.mode === "unavailable"
                  ? "Sign-in isn’t available right now, so orders can’t be placed. You can still browse and fill your cart."
                  : "Browse and fill your cart freely. Sign in before placing an order: signing in for the first time creates your account."}
              </p>
            </div>
            {auth.mode !== "unavailable" && (
              <PopoverClose asChild>
                <Button asChild><Link href="/login"><LogIn aria-hidden="true" />Sign in</Link></Button>
              </PopoverClose>
            )}
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
