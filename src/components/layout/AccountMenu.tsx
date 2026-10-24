"use client";

import Link from "next/link";
import { ChevronDown, Heart, Package, UserRound } from "lucide-react";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOrders } from "@/context/OrdersContext";
import { formatPrice } from "@/lib/formatters";
import { orderStatusLabels } from "@/lib/orders";

// Authentication is out of scope for this phase. The menu says so, and links to the orders and
// wishlist saved in this browser so customers can get back to them.
// Trigger follows the reference: tinted glass avatar circle, then the label and a chevron.
export function AccountMenu() {
  const { orders, hydrated } = useOrders();
  const recent = orders.slice(0, 3);

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
      <PopoverContent align="end" className="w-80 gap-3 p-4">
        <div>
          <p className="font-heading text-base font-medium">Accounts are coming soon</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign-in and profiles will arrive in a later release. Orders and your wishlist are saved in this browser for now.
          </p>
        </div>
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold"><Package className="size-4" aria-hidden="true" />Your orders</p>
          {hydrated && recent.length > 0 ? (
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
          <Link href="/wishlist" className="flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-medium text-primary outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring">
            <Heart className="size-4" aria-hidden="true" /> Your wishlist
          </Link>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  );
}
