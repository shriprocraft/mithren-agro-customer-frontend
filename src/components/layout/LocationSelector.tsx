"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAnnounce } from "@/context/AnnouncerContext";
import { cn } from "@/lib/utils";
import type { DeliveryArea } from "@/types/catalog";

// Sample areas only: no geolocation is requested and serviceability is not checked.
export function LocationSelector({ areas, className }: { areas: DeliveryArea[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const announce = useAnnounce();
  const selected = areas.find((area) => area.id === selectedId);

  const choose = (area: DeliveryArea) => {
    setSelectedId(area.id);
    setOpen(false);
    announce(`Browsing as ${area.label} ${area.postal_code}.`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-left text-[0.8125rem] transition-colors outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <span className="glass-chip grid size-9 shrink-0 place-items-center rounded-full">
          <MapPin className="size-[1.125rem] text-foreground" aria-hidden="true" />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[0.6875rem] text-muted-foreground">Deliver to</span>
          <span className="font-medium">{selected ? `${selected.label} ${selected.postal_code}` : "Choose area"}</span>
        </span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-3 p-4">
        <fieldset>
          <legend className="font-heading text-base font-medium">Choose a sample area</legend>
          <p className="mt-1 text-xs text-muted-foreground">
            Delivery areas are not checked in this preview. Your choice is only used on this page.
          </p>
          <div className="mt-3 grid gap-1">
            {areas.map((area) => (
              <label
                key={area.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 hover:bg-muted has-checked:bg-secondary has-focus-visible:ring-2 has-focus-visible:ring-ring"
              >
                <input
                  type="radio"
                  name="delivery-area"
                  checked={area.id === selectedId}
                  onChange={() => choose(area)}
                  className="size-4 accent-primary outline-none"
                />
                <span className="text-sm">
                  {area.label} <span className="text-muted-foreground">{area.postal_code}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}
