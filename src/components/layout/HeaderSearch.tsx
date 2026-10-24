"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Opens the marketplace with the search term (a new search starts without other filters).
// As in the reference, the magnifier at the start of the glass field is the submit button.
export function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        "glass-field flex h-11 items-center rounded-full pr-2 transition-shadow has-focus-visible:ring-2 has-focus-visible:ring-ring",
        className,
      )}
    >
      <Button type="submit" variant="ghost" size="icon" className="shrink-0 text-foreground" aria-label="Search">
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
