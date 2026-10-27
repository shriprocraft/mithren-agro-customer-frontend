"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ConfirmDialog } from "@/components/account/ConfirmDialog";
import { AddressForm } from "@/components/checkout/AddressForm";
import { MessageState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { useAddressBook } from "@/context/AddressBookContext";
import { useCheckout } from "@/context/CheckoutContext";
import { useToast } from "@/context/ToastContext";
import { addressTypeLabels, formatAddressLine } from "@/lib/address";
import { cn } from "@/lib/utils";

const notSaved = "Change not saved";
const notSavedHelp = "It applies for this visit only: this browser isn’t letting the site store data. Check that site storage is enabled.";

type Mode = { kind: "list" } | { kind: "add" } | { kind: "edit"; id: string };

// "My addresses" edits the same address book checkout uses (AddressBookContext), with the same form and
// validation, so the two can never disagree. The default address is the one checkout preselects.
export function AddressManager() {
  const book = useAddressBook();
  const { session, selectAddress } = useCheckout();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>({ kind: "list" });

  const addAddress = (input: Parameters<typeof book.add>[0]) => {
    const { address, saved } = book.add(input);
    if (book.addresses.length === 0) book.setDefault(address.id);
    return saved;
  };

  if (mode.kind !== "list") {
    const editing = mode.kind === "edit" ? book.addresses.find((a) => a.id === mode.id) : undefined;
    return (
      <div className="space-y-5">
        <AccountPageHeader title={editing ? "Edit address" : "Add an address"} description="Saved in this browser only, for this demo." />
        <section aria-label={editing ? "Edit address" : "Add an address"} className="surface-card rounded-3xl p-5 sm:p-6">
          <AddressForm
            initial={editing}
            submitLabel={editing ? "Save changes" : "Save address"}
            onSubmit={(input) => {
              const saved = editing ? book.update(editing.id, input) : addAddress(input);
              if (saved) toast.success(editing ? "Address updated" : "Address saved", { id: "address", description: `${input.full_name}, ${input.city}` });
              else toast.error(notSaved, { id: "address", description: notSavedHelp });
              setMode({ kind: "list" });
            }}
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
        description="Used at checkout. Saved in this browser only, not in a customer database."
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
                  {address.is_sample && <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">Sample</span>}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{formatAddressLine(address)}</p>
                <p className="text-sm text-muted-foreground">Mobile {address.mobile}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {!isDefault && (
                    <Button variant="outline" onClick={() => {
                      if (book.setDefault(address.id)) toast.success("Default address updated", { id: "address", description: `${address.full_name}, ${address.city}` });
                      else toast.error(notSaved, { id: "address", description: notSavedHelp });
                    }}>
                      <Star aria-hidden="true" />Set as default<span className="sr-only">: {address.full_name}, {address.city}</span>
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setMode({ kind: "edit", id: address.id })} aria-label={`Edit address for ${address.full_name}, ${address.city}`}>
                    <Pencil aria-hidden="true" />Edit
                  </Button>
                  <ConfirmDialog
                    title="Delete this address?"
                    description={`${address.full_name}, ${formatAddressLine(address)} will be removed from this browser.`}
                    confirmLabel="Delete address"
                    onConfirm={() => {
                      const saved = book.remove(address.id);
                      if (session.address_id === address.id) selectAddress(null);
                      if (saved) toast.success("Address deleted", { id: "address", description: `${address.full_name}, ${address.city}` });
                      else toast.error(notSaved, { id: "address", description: notSavedHelp });
                    }}
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
