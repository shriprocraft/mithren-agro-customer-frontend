"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useBackendCustomerId, useOptionalAuth } from "@/context/AuthContext";
import { usePersistentState } from "@/hooks/usePersistentState";
import { cleanAddress, parseAddresses } from "@/lib/address";
import { accountAddressService, type AddressService } from "@/services/addresses";
import type { Address, AddressInput } from "@/types/order";

// Saved delivery addresses. A customer signed in through the backend uses their account's address book
// (the customer API); guests keep addresses they type in this
// browser's localStorage. Browser-stored addresses are never uploaded or deleted when someone signs in:
// they reappear when the customer signs out. The default address is the one checkout preselects.
interface AddressBookValue {
  addresses: Address[];
  /** False while the addresses (or the sign-in state that decides where they live) are still loading. */
  hydrated: boolean;
  /** Where changes are kept: this browser, or the signed-in customer's account. */
  storage: "browser" | "account";
  /** Id of the default address, when it still exists. */
  defaultId: string | null;
  // Each change resolves to whether it was stored (false when site storage is blocked, or the account
  // API refused or couldn't be reached), so the UI reports success only once it is saved.
  setDefault: (id: string | null) => Promise<boolean>;
  /** Saves a validated address. `address` is null when an account save failed. */
  add: (input: AddressInput) => Promise<{ address: Address | null; saved: boolean }>;
  update: (id: string, input: AddressInput) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

interface AccountBook {
  customerId: string;
  addresses: Address[];
  defaultId: string | null;
}

const AddressBookContext = createContext<AddressBookValue | null>(null);
const EMPTY: Address[] = [];
const parseId = (value: unknown): string | null => (typeof value === "string" ? value : null);

export function AddressBookProvider({ children, service = accountAddressService }: { children: ReactNode; service?: AddressService | null }) {
  const [stored, setStored, storageHydrated] = usePersistentState("mithren.addresses", EMPTY, parseAddresses);
  const [storedDefault, setStoredDefault] = usePersistentState<string | null>("mithren.addresses.default", null, parseId);
  const browserDefaultId = stored.some((a) => a.id === storedDefault) ? storedDefault : null;

  const auth = useOptionalAuth();
  const backendCustomerId = useBackendCustomerId();
  const customerId = service ? backendCustomerId : null;
  // Until the session check finishes, it isn't known which book to show, so neither is shown.
  const signInPending = Boolean(service) && auth?.mode === "backend" && auth.status === "loading";
  const [account, setAccount] = useState<AccountBook | null>(null);
  const accountLoaded = customerId !== null && account?.customerId === customerId;

  useEffect(() => {
    if (!customerId || !service) return;
    let live = true;
    const load = (result: { addresses: Address[]; default_address_id: string | null }) => {
      if (live) setAccount({ customerId, addresses: result.addresses, defaultId: result.default_address_id });
    };
    // A failed load shows an empty book rather than spinning forever; changes still go to the API.
    service.list().then(load, () => load({ addresses: [], default_address_id: null }));
    return () => {
      live = false;
    };
  }, [customerId, service]);

  const updateAccount = useCallback(
    (change: (book: AccountBook) => AccountBook) => setAccount((current) => (current && current.customerId === customerId ? change(current) : current)),
    [customerId],
  );

  const value = useMemo<AddressBookValue>(() => {
    if (customerId && service) {
      return {
        addresses: accountLoaded ? account.addresses : EMPTY,
        hydrated: accountLoaded,
        storage: "account",
        defaultId: accountLoaded ? account.defaultId : null,
        setDefault: async (id) => {
          if (id === null) return false;
          try {
            const defaultId = await service.setDefault(id);
            updateAccount((book) => ({ ...book, defaultId }));
            return true;
          } catch {
            return false;
          }
        },
        add: async (input) => {
          try {
            const address = await service.create(input);
            // The account's first address becomes its default (the API does the same).
            updateAccount((book) => ({ ...book, addresses: [address, ...book.addresses], defaultId: book.addresses.length === 0 ? address.id : book.defaultId }));
            return { address, saved: true };
          } catch {
            return { address: null, saved: false };
          }
        },
        update: async (id, input) => {
          try {
            const address = await service.update(id, input);
            updateAccount((book) => ({ ...book, addresses: book.addresses.map((a) => (a.id === id ? address : a)) }));
            return true;
          } catch {
            return false;
          }
        },
        remove: async (id) => {
          try {
            await service.remove(id);
            updateAccount((book) => ({ ...book, addresses: book.addresses.filter((a) => a.id !== id), defaultId: book.defaultId === id ? null : book.defaultId }));
            return true;
          } catch {
            return false;
          }
        },
      };
    }

    return {
      addresses: stored,
      hydrated: storageHydrated && !signInPending,
      storage: "browser",
      defaultId: browserDefaultId,
      setDefault: async (id) => setStoredDefault(id),
      add: async (input) => {
        const address: Address = { ...cleanAddress(input), id: `addr-${crypto.randomUUID()}` };
        const saved = setStored((current) => [...current, address]);
        return { address, saved };
      },
      update: async (id, input) =>
        setStored((current) => current.map((a) => (a.id === id ? { ...cleanAddress(input), id } : a))),
      remove: async (id) => {
        const saved = setStored((current) => current.filter((a) => a.id !== id));
        if (id === browserDefaultId) setStoredDefault(null);
        return saved;
      },
    };
  }, [customerId, service, account, accountLoaded, updateAccount, stored, storageHydrated, signInPending, browserDefaultId, setStored, setStoredDefault]);

  return <AddressBookContext.Provider value={value}>{children}</AddressBookContext.Provider>;
}

export function useAddressBook() {
  const book = useContext(AddressBookContext);
  if (!book) throw new Error("useAddressBook must be used inside AddressBookProvider");
  return book;
}
