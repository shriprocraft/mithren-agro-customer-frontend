"use client";

import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package } from "lucide-react";
import { DemoBadge } from "@/components/account/DemoBadge";
import { OrderCard } from "@/components/account/OrderCard";
import { MessageState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { useAddressBook } from "@/context/AddressBookContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useOrders } from "@/context/OrdersContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatAddressLine } from "@/lib/address";

// Account home: greeting, three shortcuts with live counts, and the latest orders.
export function AccountOverview() {
  const { profile } = useDemoAccount();
  const { orders } = useOrders();
  const { addresses, defaultId } = useAddressBook();
  const { ids } = useWishlist();
  const firstName = profile.full_name.split(/\s+/)[0] || profile.full_name;
  const defaultAddress = addresses.find((a) => a.id === defaultId);

  const shortcuts = [
    { href: "/account/orders", Icon: Package, title: "My Orders", detail: `${orders.length} ${orders.length === 1 ? "order" : "orders"}` },
    { href: "/account/addresses", Icon: MapPin, title: "My Addresses", detail: defaultAddress ? `Default: ${defaultAddress.city}` : `${addresses.length} saved` },
    { href: "/account/wishlist", Icon: Heart, title: "My Wishlist", detail: `${ids.length} saved ${ids.length === 1 ? "item" : "items"}` },
  ];

  return (
    <div className="space-y-8">
      <section aria-labelledby="overview-title" className="rounded-3xl bg-soft p-5 ring-1 ring-border sm:p-7">
        <DemoBadge />
        <Heading as="h1" id="overview-title" variant="h1" className="mt-3 text-[1.625rem] sm:text-3xl">Hello, {firstName}</Heading>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          This is the demo account. Its orders and address are sample data, nothing here is a real purchase, and everything is saved in this browser only.
        </p>
        {defaultAddress && <p className="mt-3 text-sm"><span className="text-muted-foreground">Delivering to </span><span className="font-medium">{formatAddressLine(defaultAddress)}</span></p>}
      </section>

      <ul className="grid gap-3 sm:grid-cols-3">
        {shortcuts.map(({ href, Icon, title, detail }) => (
          <li key={href}>
            <Link href={href} className="group surface-card flex min-h-20 items-center gap-3 rounded-2xl p-4 outline-none hover:ring-1 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-ring">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-brand"><Icon className="size-5" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{title}</span>
                <span className="block truncate text-sm text-muted-foreground">{detail}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="recent-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="recent-title" className="font-heading text-lg font-semibold">Recent orders</h2>
          {orders.length > 0 && (
            <Link href="/account/orders" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
              All orders <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
        {orders.length === 0 ? (
          <div className="mt-3">
            <MessageState icon={Package} title="No orders yet" actions={<Button asChild><Link href="/products">Start shopping</Link></Button>}>
              Orders you place in this browser appear here.
            </MessageState>
          </div>
        ) : (
          <ul className="mt-3 grid gap-3">
            {orders.slice(0, 3).map((order) => <li key={order.id}><OrderCard order={order} /></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
