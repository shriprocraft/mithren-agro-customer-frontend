"use client";

import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package } from "lucide-react";
import { OrderCard } from "@/components/account/OrderCard";
import { MessageState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { useAddressBook } from "@/context/AddressBookContext";
import { useAuth, useBackendCustomerId } from "@/context/AuthContext";
import { useOrders } from "@/context/OrdersContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatAddressLine } from "@/lib/address";

/** "+919876543210" -> "+91 98765 43210". */
function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "your mobile number";
  const match = /^\+91(\d{5})(\d{5})$/.exec(phone);
  return match ? `+91 ${match[1]} ${match[2]}` : phone;
}

// Account home for the signed-in customer: greeting, three shortcuts with live counts, and the latest
// orders, all from their account on the backend.
export function AccountOverview() {
  const { session } = useAuth();
  const signedIn = Boolean(useBackendCustomerId());
  const customer = signedIn && session?.source === "backend" ? session.customer : null;
  const { orders, hydrated: ordersReady } = useOrders();
  const { addresses, defaultId, hydrated: addressesReady } = useAddressBook();
  const { ids, hydrated: wishlistReady } = useWishlist();
  const name = customer?.full_name?.trim() || "";
  const firstName = name.split(/\s+/)[0] || name;
  const defaultAddress = addresses.find((a) => a.id === defaultId);
  const count = (ready: boolean, text: string) => (ready ? text : "Loading…");

  const shortcuts = [
    { href: "/account/orders", Icon: Package, title: "My Orders", detail: count(ordersReady, `${orders.length} ${orders.length === 1 ? "order" : "orders"}`) },
    {
      href: "/account/addresses", Icon: MapPin, title: "My Addresses",
      detail: count(addressesReady, `${addresses.length} saved${defaultAddress ? ` · Default: ${defaultAddress.city}` : ""}`),
    },
    { href: "/account/wishlist", Icon: Heart, title: "My Wishlist", detail: count(wishlistReady, `${ids.length} saved ${ids.length === 1 ? "item" : "items"}`) },
  ];

  return (
    <div className="space-y-8">
      <section aria-labelledby="overview-title" className="rounded-3xl bg-soft p-5 ring-1 ring-border sm:p-7">
        <Heading as="h1" id="overview-title" variant="h1" className="text-[1.625rem] sm:text-3xl">
          {firstName ? `Hello, ${firstName}` : "Hello"}
        </Heading>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {customer
            ? `Signed in as ${customer.phone ? formatPhone(customer.phone) : customer.email ?? "a Mithren Agro customer"}. Your orders, addresses and wishlist are kept in your account.`
            : "Loading your account…"}
        </p>
        {customer && !customer.full_name && (
          <p className="mt-2 text-sm"><Link href="/account/profile" className="font-medium text-primary underline-offset-4 hover:underline">Add your name</Link> for your orders and deliveries.</p>
        )}
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
              Orders you place appear here, with their status and tracking.
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
