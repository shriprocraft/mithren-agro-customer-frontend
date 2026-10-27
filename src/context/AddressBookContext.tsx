"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { cleanAddress, parseAddresses } from "@/lib/address";
import type { Address, AddressInput } from "@/types/order";

// Saved delivery addresses, kept in this browser's localStorage for the demo (no account backend).
// The one address book behind checkout and the account's "My addresses"; the default address is the
// one checkout preselects.
interface AddressBookValue {
  addresses: Address[];
  hydrated: boolean;
  /** Id of the default address, when it still exists. */
  defaultId: string | null;
  // Each change returns whether this browser stored it (false when site storage is blocked; the
  // change then lasts for this visit only), so the UI reports success only once it is saved.
  setDefault: (id: string | null) => boolean;
  /** Saves a validated address and returns it with its new id. */
  add: (input: AddressInput) => { address: Address; saved: boolean };
  update: (id: string, input: AddressInput) => boolean;
  remove: (id: string) => boolean;
  /** Demo account: adds the fictional sample address (flagged is_sample) and returns it. */
  addSample: (input: AddressInput) => Address;
  /** Demo account: removes every sample address. */
  removeSamples: () => void;
}

const AddressBookContext = createContext<AddressBookValue | null>(null);
const EMPTY: Address[] = [];
const parseId = (value: unknown): string | null => (typeof value === "string" ? value : null);

export function AddressBookProvider({ children }: { children: ReactNode }) {
  const [addresses, setAddresses, hydrated] = usePersistentState("mithren.addresses", EMPTY, parseAddresses);
  const [storedDefault, setStoredDefault] = usePersistentState<string | null>("mithren.addresses.default", null, parseId);
  const defaultId = addresses.some((a) => a.id === storedDefault) ? storedDefault : null;

  const value = useMemo<AddressBookValue>(
    () => ({
      addresses,
      hydrated,
      defaultId,
      setDefault: (id) => setStoredDefault(id),
      add: (input) => {
        const address: Address = { ...cleanAddress(input), id: `addr-${crypto.randomUUID()}` };
        const saved = setAddresses((current) => [...current, address]);
        return { address, saved };
      },
      update: (id, input) =>
        setAddresses((current) => current.map((a) => (a.id === id ? { ...cleanAddress(input), id, ...(a.is_sample && { is_sample: true }) } : a))),
      remove: (id) => {
        const saved = setAddresses((current) => current.filter((a) => a.id !== id));
        if (id === defaultId) setStoredDefault(null);
        return saved;
      },
      addSample: (input) => {
        const address: Address = { ...cleanAddress(input), id: `addr-sample-${crypto.randomUUID()}`, is_sample: true };
        setAddresses((current) => [...current, address]);
        return address;
      },
      removeSamples: () => {
        if (addresses.find((a) => a.id === defaultId)?.is_sample) setStoredDefault(null);
        setAddresses((current) => current.filter((a) => !a.is_sample));
      },
    }),
    [addresses, hydrated, defaultId, setAddresses, setStoredDefault],
  );

  return <AddressBookContext.Provider value={value}>{children}</AddressBookContext.Provider>;
}

export function useAddressBook() {
  const book = useContext(AddressBookContext);
  if (!book) throw new Error("useAddressBook must be used inside AddressBookProvider");
  return book;
}
