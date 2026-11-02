"use client";

import { useAddressBook } from "@/context/AddressBookContext";
import { usePersistentState } from "@/hooks/usePersistentState";
import { ACTIVE_ADDRESS_KEY, parseActiveAddressId } from "@/lib/delivery-location";

/** The saved address chosen in the header's location control; checkout preselects it. */
export function useDeliveryAddress() {
  const { addresses } = useAddressBook();
  const [activeId, setActiveId, hydrated] = usePersistentState<string | null>(ACTIVE_ADDRESS_KEY, null, parseActiveAddressId);
  return { activeAddress: addresses.find((a) => a.id === activeId), setActiveId, hydrated };
}
