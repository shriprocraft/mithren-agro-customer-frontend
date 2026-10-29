"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HeaderSearchProps {
  className?: string;
  /**
   * "compact": the header's glass field, where the magnifier at the start is the submit button.
   * "large": the homepage search above "Shop by category", with a visible label, a clear button and a
   * labelled Search button.
   */
  size?: "compact" | "large";
}

/** The one place a search becomes a URL: the marketplace (/products) reads `q` and does the matching. */
export function searchHref(query: string): string {
  const q = query.trim();
  return q ? `/products?q=${encodeURIComponent(q)}` : "/products";
}

// Opens the marketplace with the search term (a new search starts without other filters). Both sizes
// share this submit logic; lib/marketplace.ts matches the term against product, seller and category names.
export function HeaderSearch({ className, size = "compact" }: HeaderSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [emptyHint, setEmptyHint] = useState(false);
  const [pending, startTransition] = useTransition();
  const large = size === "large";
  const inputId = large ? "home-search-input" : "site-search";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The header keeps its quick "browse everything" on an empty search; the large field asks for a term.
    if (large && !value.trim()) {
      setEmptyHint(true);
      document.getElementById(inputId)?.focus();
      return;
    }
    startTransition(() => router.push(searchHref(value)));
  };

  if (!large) {
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
        <label htmlFor={inputId} className="sr-only">
          Search products
        </label>
        <Input
          id={inputId}
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

  return (
    <form role="search" aria-label="Search the store" onSubmit={handleSubmit} noValidate className={cn("w-full", className)}>
      <label htmlFor={inputId} className="mb-2 block text-center font-heading text-sm font-medium text-foreground sm:text-base">
        What are you looking for today?
      </label>
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-card p-1.5 shadow-[var(--elevation-card)] transition-shadow has-focus-visible:border-primary/40 has-focus-visible:ring-2 has-focus-visible:ring-ring sm:gap-2">
        <Search className="ml-3 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Input
          id={inputId}
          type="search"
          name="q"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (emptyHint) setEmptyHint(false);
          }}
          placeholder="Search fruits, vegetables, organic products and more…"
          autoComplete="off"
          enterKeyHint="search"
          aria-invalid={emptyHint || undefined}
          aria-describedby={emptyHint ? `${inputId}-hint` : undefined}
          className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent px-1 text-base focus-visible:ring-0 aria-invalid:ring-0 md:text-[0.9375rem] [&::-webkit-search-cancel-button]:appearance-none"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              document.getElementById(inputId)?.focus();
            }}
            className="text-muted-foreground"
          >
            <X aria-hidden="true" />
          </Button>
        )}
        <Button type="submit" loading={pending} className="px-4 sm:px-7">
          {!pending && <Search className="sm:hidden" aria-hidden="true" />}
          <span className="max-sm:sr-only">{pending ? "Searching…" : "Search"}</span>
        </Button>
      </div>
      {emptyHint && (
        <p id={`${inputId}-hint`} role="alert" className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-destructive">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Type a product name to search, or{" "}
            <Link href="/products" className="font-medium underline underline-offset-2">
              browse all products
            </Link>
            .
          </span>
        </p>
      )}
    </form>
  );
}
