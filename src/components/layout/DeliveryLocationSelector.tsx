"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, Check, ChevronDown, CircleAlert, Info, LocateFixed, MapPin, Plus, Search, Truck } from "lucide-react";
import { AddressForm } from "@/components/checkout/AddressForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAddressBook } from "@/context/AddressBookContext";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useToast } from "@/context/ToastContext";
import { indianStates } from "@/data/indian-states";
import type { District } from "@/data/tamil-nadu-districts";
import { useDeliveryAddress } from "@/hooks/useDeliveryAddress";
import { usePersistentState } from "@/hooks/usePersistentState";
import { addressShortLabel, addressTypeLabels, emptyAddress, formatAddressLine } from "@/lib/address";
import {
  DELIVERY_LOCATION_KEY,
  geolocationErrorMessage,
  getCurrentCoordinates,
  nearestDistrict,
  parseDeliveryLocation,
  searchDistricts,
  serviceabilityNote,
  type DeliveryLocation,
  type GeolocationFailure,
} from "@/lib/delivery-location";
import { cn } from "@/lib/utils";
import { reverseGeocoder, type Coordinates, type GeocodedAddress, type ReverseGeocodingService } from "@/services/geocoding";
import type { AddressInput } from "@/types/order";

// "Delivering to" control in the header. The panel offers three ways to set where an order goes: share
// the device location (asked only when the button is pressed, read once, never tracked), pick or add a
// saved address (the same address book as checkout and My Addresses), or pick a Tamil Nadu district.
//
// A position is not an address. It goes to the reverse-geocoding service, and the customer always
// reviews and saves the result. If there is no service, the panel says the position was found but the
// address wasn't: nothing is made up, a nearby district may be suggested, and the customer types the
// address. Coordinates are stored only on an address the customer saves. Delivery coverage isn't
// configured, so nothing says an area is served (lib/delivery-location.ts).
//
// The district list is a combobox: type to filter, ↑/↓ to move, Enter to choose. Escape and clicks
// outside close the panel (Radix Popover), which flips and shifts to stay on screen.

type GeoState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "address-found"; coordinates: Coordinates; address: GeocodedAddress }
  | { status: "position-only"; coordinates: Coordinates; district: District | null; lookup: "unavailable" | "not_found" | "error" }
  | { status: "error"; message: string };

const NO_LOCATION: DeliveryLocation | null = null;

/** Starts the form from a looked-up address; only values the form can accept are carried over. */
function addressFormValues(coordinates: Coordinates, address?: GeocodedAddress): AddressInput {
  return {
    ...emptyAddress,
    ...coordinates,
    street: address?.street ?? "",
    city: address?.city ?? "",
    state: address?.state && indianStates.includes(address.state) ? address.state : "",
    pincode: address?.postal_code ?? "",
  };
}

export function DeliveryLocationSelector({ className, geocoder = reverseGeocoder }: { className?: string; geocoder?: ReverseGeocodingService }) {
  const [location, setLocation, hydrated] = usePersistentState(DELIVERY_LOCATION_KEY, NO_LOCATION, parseDeliveryLocation);
  const book = useAddressBook();
  const { activeAddress, setActiveId, hydrated: activeReady } = useDeliveryAddress();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [formInitial, setFormInitial] = useState<AddressInput | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const mounted = useRef(true);
  const announce = useAnnounce();
  const toast = useToast();
  const ids = useId();
  const listId = `${ids}-districts`;
  const optionId = (index: number) => `${ids}-district-${index}`;

  const results = searchDistricts(query);
  const selected = hydrated ? location?.district : undefined;
  const chosenAddress = hydrated && activeReady && book.hydrated ? activeAddress : undefined;
  const label = chosenAddress ? addressShortLabel(chosenAddress) : selected;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Keep the highlighted option in view while moving with the keyboard.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery("");
      setFormInitial(null);
      // Start on the saved district, so Enter keeps it and arrows move from it.
      const index = selected ? searchDistricts("").findIndex((d) => d.name === selected) : 0;
      setActive(Math.max(0, index));
      if (geo.status !== "locating") setGeo({ status: "idle" });
    }
  };

  const finish = (name: string, persisted: boolean) => {
    setOpen(false);
    setGeo({ status: "idle" });
    setFormInitial(null);
    announce(`Delivery location set to ${name}.`);
    if (persisted) {
      toast.success(`Delivering to ${name}`, { id: "delivery-location", description: serviceabilityNote(name) });
    } else {
      toast.info(`${name} set for this visit only`, {
        id: "delivery-location",
        description: "This browser isn’t letting us save it. Check that site storage is enabled.",
      });
    }
  };

  const choose = (district: string, source: DeliveryLocation["source"]) => {
    setActiveId(null);
    finish(district, setLocation({ district, source }));
  };

  const chooseAddress = (id: string, name: string) => finish(name, setActiveId(id));

  const saveAddress = (input: AddressInput) => {
    const { address, saved } = book.add(input);
    setActiveId(address.id);
    finish(addressShortLabel(address), saved);
  };

  const locateDevice = async () => {
    if (geo.status === "locating") return;
    setGeo({ status: "locating" });
    let coordinates: Coordinates;
    try {
      coordinates = await getCurrentCoordinates();
    } catch (failure) {
      if (mounted.current) setGeo({ status: "error", message: geolocationErrorMessage(failure as GeolocationFailure) });
      return;
    }
    const result = await geocoder.reverse(coordinates);
    if (!mounted.current) return;
    if (result.status === "found") {
      setGeo({ status: "address-found", coordinates, address: result.address });
    } else {
      setGeo({ status: "position-only", coordinates, lookup: result.status, district: nearestDistrict({ lat: coordinates.latitude, lng: coordinates.longitude }) });
    }
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const district = results[Math.min(active, results.length - 1)];
      if (district) choose(district.name, "list");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(
          "group glass-chip inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-full py-1 pr-3 pl-1 text-left transition-colors outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=open]:bg-card sm:pr-4 lg:min-w-60",
          className,
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-card text-brand shadow-[0_4px_12px_-6px_rgb(var(--shadow-tint)/0.45)]">
          <Truck className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[0.8125rem] font-semibold whitespace-nowrap text-foreground">
            Delivering to<span className="sr-only">:</span>
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {label ?? "Select your location"}
            <span className="sr-only">. {label ? "Change" : "Choose"} delivery location</span>
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-brand transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        aria-labelledby={`${ids}-title`}
        className="max-h-[min(85svh,44rem)] w-[min(26rem,calc(100vw-2rem))] gap-0 overflow-x-hidden overflow-y-auto overscroll-contain rounded-3xl border border-border bg-card! bg-none! p-0 shadow-[var(--elevation-overlay)]! backdrop-blur-none!"
        // Pointer users start typing straight away; on touch screens the keyboard would hide the list.
        onOpenAutoFocus={(event) => {
          if (window.matchMedia("(pointer: fine)").matches) {
            event.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        {formInitial ? (
          <div className="p-4">
            <Button type="button" variant="ghost" onClick={() => setFormInitial(null)} className="-ml-2 px-2">
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
            <h2 id={`${ids}-title`} className="mt-1 mb-1 font-heading text-base font-semibold text-foreground">Add a delivery address</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {formInitial.latitude !== undefined
                ? "Check every detail before saving: a detected location can be inexact. Your detected position is saved with this address."
                : "Saved in this browser only, for this preview."}
            </p>
            <AddressForm initial={formInitial} submitLabel="Save and deliver here" onSubmit={saveAddress} onCancel={() => setFormInitial(null)} />
          </div>
        ) : (
          <>
            <div className="border-b border-border px-4 pt-4 pb-3">
              <h2 id={`${ids}-title`} className="font-heading text-base font-semibold text-foreground">
                Choose your delivery location
              </h2>
              <Button type="button" variant="outline" loading={geo.status === "locating"} onClick={locateDevice} className="mt-3 w-full justify-start">
                {geo.status !== "locating" && <LocateFixed aria-hidden="true" />}
                {geo.status === "locating" ? "Finding your location…" : geo.status === "error" ? "Try again" : geo.status === "idle" ? "Use my current location" : "Detect my location again"}
              </Button>
              <GeoMessage geo={geo} onConfirmDistrict={(name) => choose(name, "device")} onReview={(initial) => setFormInitial(initial)} />
            </div>

            <section aria-labelledby={`${ids}-saved`} className="border-b border-border px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 id={`${ids}-saved`} className="text-xs font-semibold text-foreground">Saved addresses</h3>
                <Button type="button" variant="ghost" onClick={() => setFormInitial(emptyAddress)} className="-mr-2 h-9 px-2 text-xs">
                  <Plus aria-hidden="true" />
                  Add address
                </Button>
              </div>
              {book.hydrated && book.addresses.length > 0 ? (
                <ul className="mt-1 grid gap-1.5">
                  {book.addresses.map((address) => {
                    const isActive = chosenAddress?.id === address.id;
                    return (
                      <li key={address.id}>
                        <button
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => chooseAddress(address.id, addressShortLabel(address))}
                          className={cn("flex min-h-11 w-full items-start gap-2.5 rounded-xl border px-3 py-2 text-left text-xs outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring", isActive ? "border-primary bg-soft" : "border-border")}
                        >
                          <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden="true" />
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-foreground">{addressTypeLabels[address.type]}: {address.full_name}</span>
                            <span className="block text-muted-foreground">{formatAddressLine(address)}</span>
                          </span>
                          {isActive && <Check className="size-4 shrink-0 text-brand" aria-hidden="true" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No saved addresses yet.</p>
              )}
            </section>

            <div className="px-4 pt-3">
              <label htmlFor={`${ids}-search`} className="text-xs font-semibold text-foreground">
                Or select a Tamil Nadu district
              </label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  ref={inputRef}
                  id={`${ids}-search`}
                  type="search"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={results.length ? optionId(Math.min(active, results.length - 1)) : undefined}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onListKeyDown}
                  placeholder="Search districts…"
                  autoComplete="off"
                  className="h-10 rounded-full pl-9"
                />
              </div>
            </div>

            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label="Tamil Nadu districts"
              className="mt-2 max-h-[min(11rem,30svh)] overflow-y-auto overscroll-contain px-2 pb-2"
            >
              {results.map((district, index) => {
                const isSelected = !chosenAddress && district.name === selected;
                return (
                  <li
                    key={district.name}
                    id={optionId(index)}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => choose(district.name, "list")}
                    onMouseMove={() => setActive(index)}
                    className={cn(
                      "flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-xl px-3 text-sm",
                      index === active && "bg-soft",
                      isSelected && "font-semibold text-brand",
                    )}
                  >
                    {district.name}
                    {isSelected && <Check className="size-4 shrink-0 text-brand" aria-hidden="true" />}
                  </li>
                );
              })}
            </ul>
            {results.length === 0 && (
              <p role="status" className="px-4 pb-4 text-sm text-muted-foreground">
                No Tamil Nadu district matches “{query.trim()}”. Check the spelling and try again.
              </p>
            )}

            {label && (
              <p className="flex gap-2 border-t border-border bg-secondary px-4 py-3 text-xs leading-relaxed text-secondary-foreground">
                <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                {serviceabilityNote(label)}
              </p>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function GeoMessage({ geo, onConfirmDistrict, onReview }: { geo: GeoState; onConfirmDistrict: (district: string) => void; onReview: (initial: AddressInput) => void }) {
  if (geo.status === "address-found") {
    return (
      <div role="status" className="mt-3 rounded-2xl bg-secondary p-3 text-xs leading-relaxed text-secondary-foreground">
        <p>We found this address near you:</p>
        <p className="mt-1 font-semibold">{geo.address.formatted}</p>
        <Button type="button" onClick={() => onReview(addressFormValues(geo.coordinates, geo.address))} className="mt-2 h-9 px-4 text-xs">
          Review and confirm
        </Button>
      </div>
    );
  }
  if (geo.status === "position-only") {
    const reason =
      geo.lookup === "unavailable"
        ? "Address lookup isn’t connected yet, so we can’t show your street address."
        : geo.lookup === "not_found"
          ? "We couldn’t find a street address for this position."
          : "Address lookup isn’t responding right now, so we can’t show your street address.";
    return (
      <div role="status" className="mt-3 rounded-2xl bg-secondary p-3 text-xs leading-relaxed text-secondary-foreground">
        <p><strong className="font-semibold">Position detected, but no address.</strong> {reason} Please enter your address.</p>
        {geo.district && <p className="mt-1">The nearest district headquarters is <strong className="font-semibold">{geo.district.name}</strong>. This is only an estimate.</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          <Button type="button" onClick={() => onReview(addressFormValues(geo.coordinates))} className="h-9 px-4 text-xs">Enter my address</Button>
          {geo.district && (
            <Button type="button" variant="outline" onClick={() => onConfirmDistrict(geo.district!.name)} className="h-9 px-4 text-xs">
              <Check aria-hidden="true" />
              Use {geo.district.name}
            </Button>
          )}
        </div>
      </div>
    );
  }
  if (geo.status === "error") {
    return (
      <p role="alert" className="mt-3 flex gap-2 text-xs leading-relaxed text-destructive">
        <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        {geo.message}
      </p>
    );
  }
  return null;
}
