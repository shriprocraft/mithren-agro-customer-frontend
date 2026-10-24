"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { cleanAddress, parseAddresses } from "@/lib/address";
import type { Address, AddressInput } from "@/types/order";

// Saved delivery addresses, kept in this browser's localStorage for the demo (no account backend).
interface AddressBookValue {
  addresses: Address[];
  hydrated: boolean;
  /** Saves a validated address and returns it with its new id. */
  add: (input: AddressInput) => Address;
  update: (id: string, input: AddressInput) => void;
  remove: (id: string) => void;
}

const AddressBookContext = createContext<AddressBookValue | null>(null);
const EMPTY: Address[] = [];

export function AddressBookProvider({ children }: { children: ReactNode }) {
  const [addresses, setAddresses, hydrated] = usePersistentState("mithren.addresses", EMPTY, parseAddresses);

  const value = useMemo<AddressBookValue>(
    () => ({
      addresses,
      hydrated,
      add: (input) => {
        const address: Address = { ...cleanAddress(input), id: `addr-${crypto.randomUUID()}` };
        setAddresses((current) => [...current, address]);
        return address;
      },
      update: (id, input) =>
        setAddresses((current) => current.map((a) => (a.id === id ? { ...cleanAddress(input), id } : a))),
      remove: (id) => setAddresses((current) => current.filter((a) => a.id !== id)),
    }),
    [addresses, hydrated, setAddresses],
  );

  return <AddressBookContext.Provider value={value}>{children}</AddressBookContext.Provider>;
}

export function useAddressBook() {
  const book = useContext(AddressBookContext);
  if (!book) throw new Error("useAddressBook must be used inside AddressBookProvider");
  return book;
}
