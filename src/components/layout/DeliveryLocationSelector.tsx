"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, CircleAlert, Info, LocateFixed, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useToast } from "@/context/ToastContext";
import type { District } from "@/data/tamil-nadu-districts";
import { usePersistentState } from "@/hooks/usePersistentState";
import {
  DELIVERY_LOCATION_KEY,
  geolocationErrorMessage,
  nearestDistrict,
  parseDeliveryLocation,
  searchDistricts,
  serviceabilityNote,
  type DeliveryLocation,
} from "@/lib/delivery-location";
import { cn } from "@/lib/utils";

// "Delivery by area" control on the right of the header (over the hero on the homepage). Opens a panel with two ways to choose:
// share the device location (asked only when the button is pressed) or pick one of Tamil Nadu's 38
// districts from a searchable list. The choice is saved in this browser under its own key.
//
// There is no reverse-geocoding service, so the device location cannot be turned into an address.
// Instead the district whose headquarters is nearest is *suggested* and the customer confirms it; the
// coordinates are not stored. Delivery coverage is not configured, so nothing here says a district is
// served (lib/delivery-location.ts).
//
// The list is a combobox: type to filter, ↑/↓ to move, Enter to choose. Escape and clicks outside close
// the panel (Radix Popover), which flips and shifts to stay on screen.

type GeoState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "suggested"; district: District }
  | { status: "no-match" }
  | { status: "error"; message: string };

const NO_LOCATION: DeliveryLocation | null = null;

export function DeliveryLocationSelector({ className }: { className?: string }) {
  const [location, setLocation, hydrated] = usePersistentState(DELIVERY_LOCATION_KEY, NO_LOCATION, parseDeliveryLocation);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
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
      // Start on the saved district, so Enter keeps it and arrows move from it.
      const index = selected ? searchDistricts("").findIndex((d) => d.name === selected) : 0;
      setActive(Math.max(0, index));
      if (geo.status !== "locating") setGeo({ status: "idle" });
    }
  };

  const choose = (district: string, source: DeliveryLocation["source"]) => {
    const persisted = setLocation({ district, source });
    setOpen(false);
    setGeo({ status: "idle" });
    announce(`Delivery location set to ${district}.`);
    if (persisted) {
      toast.success(`Delivering to ${district}`, { id: "delivery-location", description: serviceabilityNote(district) });
    } else {
      toast.info(`${district} set for this visit only`, {
        id: "delivery-location",
        description: "This browser isn’t letting us save it. Check that site storage is enabled.",
      });
    }
  };

  const locateDevice = () => {
    if (geo.status === "locating") return;
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeo({ status: "error", message: geolocationErrorMessage("unsupported") });
      return;
    }
    if (!window.isSecureContext) {
      setGeo({ status: "error", message: geolocationErrorMessage("insecure") });
      return;
    }
    setGeo({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted.current) return;
        const district = nearestDistrict({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeo(district ? { status: "suggested", district } : { status: "no-match" });
      },
      (error) => {
        if (!mounted.current) return;
        setGeo({ status: "error", message: geolocationErrorMessage(error.code) });
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    );
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
            Delivery by area<span className="sr-only">:</span>
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {selected ?? "Select your district"}
            <span className="sr-only">. {selected ? "Change" : "Choose"} delivery location</span>
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-brand transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        aria-labelledby={`${ids}-title`}
        className="w-[min(23rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-3xl border border-border bg-card! bg-none! p-0 shadow-[var(--elevation-overlay)]! backdrop-blur-none!"
        // Pointer users start typing straight away; on touch screens the keyboard would hide the list.
        onOpenAutoFocus={(event) => {
          if (window.matchMedia("(pointer: fine)").matches) {
            event.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        <div className="border-b border-border px-4 pt-4 pb-3">
          <h2 id={`${ids}-title`} className="font-heading text-base font-semibold text-foreground">
            Choose your delivery location
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">We currently list districts in Tamil Nadu.</p>

          <Button
            type="button"
            variant="outline"
            loading={geo.status === "locating"}
            onClick={locateDevice}
            className="mt-3 w-full justify-start"
          >
            {geo.status !== "locating" && <LocateFixed aria-hidden="true" />}
            {geo.status === "locating" ? "Finding your location…" : "Use my current location"}
          </Button>

          <GeoMessage geo={geo} onConfirm={(name) => choose(name, "device")} />
        </div>

        <div className="px-4 pt-3">
          <label htmlFor={`${ids}-search`} className="text-xs font-semibold text-foreground">
            Or select a district
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
              placeholder="Search Tamil Nadu districts…"
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
          className="mt-2 max-h-[min(15rem,40svh)] overflow-y-auto overscroll-contain px-2 pb-2"
        >
          {results.map((district, index) => {
            const isSelected = district.name === selected;
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

        {selected && (
          <p className="flex gap-2 border-t border-border bg-secondary px-4 py-3 text-xs leading-relaxed text-secondary-foreground">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            {serviceabilityNote(selected)}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function GeoMessage({ geo, onConfirm }: { geo: GeoState; onConfirm: (district: string) => void }) {
  if (geo.status === "suggested") {
    return (
      <div role="status" className="mt-3 rounded-2xl bg-secondary p-3 text-xs leading-relaxed text-secondary-foreground">
        <p>
          The nearest district headquarters to you is <strong className="font-semibold">{geo.district.name}</strong>. This is an
          estimate, so please confirm it or choose your district below.
        </p>
        <Button type="button" onClick={() => onConfirm(geo.district.name)} className="mt-2 h-9 px-4 text-xs">
          <Check aria-hidden="true" />
          Use {geo.district.name}
        </Button>
      </div>
    );
  }
  if (geo.status === "no-match" || geo.status === "error") {
    const message =
      geo.status === "error"
        ? geo.message
        : "We couldn’t match your location to a Tamil Nadu district. Please choose your district below.";
    return (
      <p role="alert" className="mt-3 flex gap-2 text-xs leading-relaxed text-destructive">
        <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        {message}
      </p>
    );
  }
  return null;
}
