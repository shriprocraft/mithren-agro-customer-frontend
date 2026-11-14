"use client";

import { useRef, useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ConfirmDialog } from "@/components/account/ConfirmDialog";
import { AddressForm } from "@/components/checkout/AddressForm";
import { LoadingState, MessageState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { useAddressBook } from "@/context/AddressBookContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useToast } from "@/context/ToastContext";
import { addressTypeLabels, formatAddressLine } from "@/lib/address";
import { cn } from "@/lib/utils";

const notSaved = "Change not saved";
const notSavedHelp = {
  browser: "It applies for this visit only: this browser isn’t letting the site store data. Check that site storage is enabled.",
  account: "Your account couldn’t be updated. Check your connection and try again.",
};
const storageNote = {
  browser: { form: "Saved in this browser only, for this demo.", list: "Used at checkout. Saved in this browser only, not in a customer database." },
  account: { form: "Saved to your account.", list: "Used at checkout. Saved to your account." },
};

type Mode = { kind: "list" } | { kind: "add" } | { kind: "edit"; id: string };

// "My addresses" edits the same address book checkout uses (AddressBookContext), with the same form and
// validation, so the two can never disagree. The default address is the one checkout preselects. A
// signed-in customer's addresses are saved to their account; otherwise they stay in this browser.
export function AddressManager() {
  const book = useAddressBook();
  const { session, selectAddress } = useCheckout();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>({ kind: "list" });
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

  const addAddress = async (input: Parameters<typeof book.add>[0]) => {
    const wasEmpty = book.addresses.length === 0;
    const { address, saved } = await book.add(input);
    // The account API makes the first address the default itself; browser storage needs it set here.
    if (saved && address && wasEmpty && book.storage === "browser") await book.setDefault(address.id);
    return saved;
  };

  if (!book.hydrated) return <LoadingState label="Loading your addresses…" />;

  if (mode.kind !== "list") {
    const editing = mode.kind === "edit" ? book.addresses.find((a) => a.id === mode.id) : undefined;
    return (
      <div className="space-y-5">
        <AccountPageHeader title={editing ? "Edit address" : "Add an address"} description={storageNote[book.storage].form} />
        <section aria-label={editing ? "Edit address" : "Add an address"} className="surface-card rounded-3xl p-5 sm:p-6">
          <AddressForm
            initial={editing}
            submitLabel={editing ? "Save changes" : "Save address"}
            onSubmit={(input) =>
              void once(async () => {
                const saved = editing ? await book.update(editing.id, input) : await addAddress(input);
                if (saved) {
                  toast.success(editing ? "Address updated" : "Address saved", { id: "address", description: `${input.full_name}, ${input.city}` });
                  setMode({ kind: "list" });
                } else {
                  toast.error(notSaved, { id: "address", description: notSavedHelp[book.storage] });
                  // Browser storage keeps the change for this visit; an account change failed, so the form stays open.
                  if (book.storage === "browser") setMode({ kind: "list" });
                }
              })
            }
            onCancel={() => setMode({ kind: "list" })}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AccountPageHeader
        title="My Addresses"
        description={storageNote[book.storage].list}
        action={<Button onClick={() => setMode({ kind: "add" })}><Plus aria-hidden="true" />Add address</Button>}
      />
      {book.addresses.length === 0 ? (
        <MessageState icon={MapPin} title="No saved addresses" actions={<Button onClick={() => setMode({ kind: "add" })}><Plus aria-hidden="true" />Add address</Button>}>
          Add a delivery address to pick it quickly at checkout.
        </MessageState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {book.addresses.map((address) => {
            const isDefault = address.id === book.defaultId;
            return (
              <li key={address.id} className={cn("surface-card flex flex-col rounded-2xl p-4 sm:p-5", isDefault && "ring-2 ring-primary/60")}>
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {address.full_name}
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{addressTypeLabels[address.type]}</span>
                  {isDefault && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Default</span>}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{formatAddressLine(address)}</p>
                <p className="text-sm text-muted-foreground">Mobile {address.mobile}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {!isDefault && (
                    <Button variant="outline" onClick={() => void once(async () => {
                      if (await book.setDefault(address.id)) toast.success("Default address updated", { id: "address", description: `${address.full_name}, ${address.city}` });
                      else toast.error(notSaved, { id: "address", description: notSavedHelp[book.storage] });
                    })}>
                      <Star aria-hidden="true" />Set as default<span className="sr-only">: {address.full_name}, {address.city}</span>
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setMode({ kind: "edit", id: address.id })} aria-label={`Edit address for ${address.full_name}, ${address.city}`}>
                    <Pencil aria-hidden="true" />Edit
                  </Button>
                  <ConfirmDialog
                    title="Delete this address?"
                    description={`${address.full_name}, ${formatAddressLine(address)} will be removed from ${book.storage === "account" ? "your account" : "this browser"}.`}
                    confirmLabel="Delete address"
                    onConfirm={() => void once(async () => {
                      const saved = await book.remove(address.id);
                      if (saved && session.address_id === address.id) selectAddress(null);
                      if (saved) toast.success("Address deleted", { id: "address", description: `${address.full_name}, ${address.city}` });
                      else toast.error(notSaved, { id: "address", description: notSavedHelp[book.storage] });
                    })}
                    trigger={
                      <Button variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Delete address for ${address.full_name}, ${address.city}`}>
                        <Trash2 aria-hidden="true" />Delete
                      </Button>
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
