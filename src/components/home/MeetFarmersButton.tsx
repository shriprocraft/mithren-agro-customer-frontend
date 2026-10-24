"use client";

import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// The reference's "Meet Our Farmers" action. Farmer profile pages are not part of this phase, so
// instead of linking to a missing page it opens a panel naming the sample growers whose produce is
// listed (derived from the catalogue, not invented) and says that profiles are coming.
export function MeetFarmersButton({ growers }: { growers: string[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="pr-6 pl-2 xl:h-12 xl:pr-8 xl:pl-2.5">
          <span className="grid size-7 place-items-center rounded-full ring-1 ring-foreground/20">
            <Sprout className="size-3.5 text-brand" aria-hidden="true" />
          </span>
          Meet Our Farmers
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-2 p-4">
        <p className="font-heading text-base font-medium">Farmer profiles are coming soon</p>
        <p className="text-sm text-muted-foreground">Fruit and vegetables in this preview are listed by these sample growers:</p>
        <ul className="mt-1 space-y-1">
          {growers.map((name) => (
            <li key={name} className="flex items-center gap-2 text-sm font-medium">
              <Sprout className="size-4 shrink-0 text-brand" aria-hidden="true" />
              {name}
            </li>
          ))}
        </ul>
        <p className="mt-1 text-xs text-muted-foreground">Sellers are fictional sample data, not real businesses.</p>
      </PopoverContent>
    </Popover>
  );
}
