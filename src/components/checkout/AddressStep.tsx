"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Pencil, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { AddressForm } from "@/components/checkout/AddressForm";
import { LoadingState, MessageState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { useAddressBook } from "@/context/AddressBookContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useToast } from "@/context/ToastContext";
import { useCheckoutLines } from "@/hooks/useCheckoutLines";
import { useCheckoutQuote } from "@/hooks/useCheckoutQuote";
import { useDeliveryAddress } from "@/hooks/useDeliveryAddress";
import { addressTypeLabels, formatAddressLine, isValidAddress } from "@/lib/address";
import { checkoutBlocker } from "@/lib/cart";
import { applyQuote } from "@/lib/checkout-quote";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

type Mode = { kind: "list" } | { kind: "add" } | { kind: "edit"; id: string };

// Choose, add, edit or remove a delivery address, then continue to review. The chosen address is
// kept in the checkout session, so it survives a refresh and coming back from the review step.
export function AddressStep({ catalog }: { catalog: Product[] }) {
  const router = useRouter();
  const toast = useToast();
  const book = useAddressBook();
  const { session, selectAddress } = useCheckout();
  const { lines, items, isBuyNow, ready } = useCheckoutLines(catalog);
  // The server's stock check (backend catalogue only). The review step checks again with the address.
  const { state: quote } = useCheckoutQuote(items, null, ready);
  const { activeAddress } = useDeliveryAddress();
  const [mode, setMode] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);
  // One change at a time, so a double click can't save an address twice.
  const busy = useRef(false);
  const once = async (change: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await change();
    } finally {
      busy.current = false;
    }
  };
  const notSavedHelp =
    book.storage === "account"
      ? "Your account couldn’t be updated. Check your connection and try again."
      : "It applies for this visit only: this browser isn’t letting the site store data.";

  if (!ready || !book.hydrated) return <LoadingState label="Loading your details…" />;

  const blocker = checkoutBlocker(lines) ?? (quote.status === "ready" ? applyQuote(lines, items, quote.quote).blocker : null);
  if (blocker) {
    return (
      <MessageState icon={ShoppingCart} title={lines.length === 0 ? "There’s nothing to check out" : "Your cart needs attention"}
        actions={<Button asChild><Link href={lines.length === 0 ? "/products" : "/cart"}>{lines.length === 0 ? "Browse products" : "Review your cart"}</Link></Button>}>
        {blocker}
      </MessageState>
    );
  }

  const { addresses } = book;
  // With no choice in this checkout: the address chosen in the header, then the default, then the first.
  const selected = addresses.find((a) => a.id === session.address_id) ?? activeAddress ?? addresses.find((a) => a.id === book.defaultId) ?? addresses[0];
  const current: Mode = mode ?? (addresses.length === 0 ? { kind: "add" } : { kind: "list" });

  const continueToReview = () => {
    if (!selected || !isValidAddress(selected)) {
      setError("Choose or add a complete delivery address to continue.");
      return;
    }
    selectAddress(selected.id);
    router.push("/checkout/review");
  };

  if (current.kind === "add" || current.kind === "edit") {
    const editing = current.kind === "edit" ? addresses.find((a) => a.id === current.id) : undefined;
    return (
      <section aria-labelledby="address-form-title" className="surface-card rounded-3xl p-5 sm:p-6">
        <h2 id="address-form-title" className="font-heading text-lg font-semibold">{editing ? "Edit address" : "Add a delivery address"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{book.storage === "account" ? "Saved to your account." : "Saved in this browser only, for this demo."}</p>
        <div className="mt-5">
          <AddressForm
            initial={editing}
            submitLabel={editing ? "Save changes" : "Save and use this address"}
            onSubmit={(input) =>
              void once(async () => {
                if (editing) {
                  const saved = await book.update(editing.id, input);
                  if (saved) toast.success("Address updated", { id: "address" });
                  else toast.error("Change not saved", { id: "address", description: notSavedHelp });
                  // An account change that failed keeps the form open so nothing typed is lost.
                  if (!saved && book.storage === "account") return;
                } else {
                  const { address, saved } = await book.add(input);
                  if (!address) {
                    toast.error("Address not saved", { id: "address", description: notSavedHelp });
                    return;
                  }
                  selectAddress(address.id);
                  if (saved) toast.success("Address saved and selected", { id: "address" });
                  else toast.info("Address selected for this order", { id: "address", description: "This browser isn’t letting the site keep it for next time." });
                }
                setError(null);
                setMode({ kind: "list" });
              })
            }
            onCancel={addresses.length > 0 ? () => setMode({ kind: "list" }) : undefined}
          />
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="address-list-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="address-list-title" className="font-heading text-lg font-semibold">Deliver to</h2>
        <Button variant="outline" onClick={() => setMode({ kind: "add" })}><Plus aria-hidden="true" />Add a new address</Button>
      </div>
      {isBuyNow && <p className="mt-2 text-sm text-muted-foreground">Buying one item now. Your cart is left as it is.</p>}
      <fieldset className="mt-4">
        <legend className="sr-only">Saved addresses</legend>
        <ul className="grid gap-3">
          {addresses.map((address) => {
            const isSelected = selected?.id === address.id;
            return (
              <li key={address.id} className={cn("surface-card flex flex-wrap items-start gap-3 rounded-2xl p-4", isSelected && "ring-2 ring-primary")}>
                <label className="flex min-w-0 flex-1 cursor-pointer gap-3">
                  <input type="radio" name="delivery-address" checked={isSelected} onChange={() => { selectAddress(address.id); setError(null); }} className="mt-1 size-4 shrink-0 accent-primary" />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2 font-medium">
                      {address.full_name}
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{addressTypeLabels[address.type]}</span>
                      {address.id === book.defaultId && <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">Default</span>}
                      {address.is_sample && <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">Sample</span>}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">{formatAddressLine(address)}</span>
                    <span className="block text-sm text-muted-foreground">Mobile {address.mobile}</span>
                  </span>
                </label>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label={`Edit address for ${address.full_name}`} onClick={() => setMode({ kind: "edit", id: address.id })}>
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Remove address for ${address.full_name}`}
                    onClick={() => void once(async () => {
                      const saved = await book.remove(address.id);
                      if (saved && session.address_id === address.id) selectAddress(null);
                      if (saved) toast.success("Address removed", { id: "address" });
                      else toast.error("Change not saved", { id: "address", description: notSavedHelp });
                    })}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </fieldset>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={continueToReview}>Continue to review<ArrowRight aria-hidden="true" /></Button>
        <Button asChild variant="outline"><Link href={isBuyNow ? "/products" : "/cart"}>{isBuyNow ? "Back to shopping" : "Back to cart"}</Link></Button>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="size-4" aria-hidden="true" /> Delivery to your area is not checked in this preview.
      </p>
    </section>
  );
}
