"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBrowse } from "@/context/BrowseContext";
import { cn } from "@/lib/utils";

// Searches the homepage catalogue browser; a dedicated /search page comes in a later phase.
// As in the reference, the magnifier at the start of the glass field is the submit button.
export function HeaderSearch({ className }: { className?: string }) {
  const { search } = useBrowse();
  const [value, setValue] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    search(value);
    // Wait for the browser section to render the results, then move the user there.
    requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("shop")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      document.getElementById("shop-results")?.focus({ preventScroll: true });
    });
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        "glass-field flex h-11 items-center rounded-full pr-2 transition-shadow has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
        className,
      )}
    >
      <Button type="submit" variant="ghost" size="icon" className="shrink-0 text-foreground hover:bg-white/70" aria-label="Search">
        <Search className="size-5" aria-hidden="true" />
      </Button>
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <Input
        id="site-search"
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search tomatoes, mangoes, dal, compost…"
        autoComplete="off"
        className="h-full rounded-none border-0 bg-transparent px-1 text-sm focus-visible:ring-0 md:text-sm"
      />
    </form>
  );
}
