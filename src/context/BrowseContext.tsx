"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { categoryFromHash, shopAnchor, type BrowseCategory } from "@/lib/browse";

// Shared state for the homepage product browser: active category and search query.
interface BrowseContextValue {
  category: BrowseCategory;
  query: string;
  selectCategory: (category: BrowseCategory) => void;
  search: (query: string) => void;
}

const BrowseContext = createContext<BrowseContextValue | null>(null);

export function BrowseProvider({ children }: { children: ReactNode }) {
  const [category, setCategory] = useState<BrowseCategory>("all");
  const [query, setQuery] = useState("");

  // The URL hash is external state: follow it on load and on every hash navigation.
  useEffect(() => {
    const sync = () => {
      const fromHash = categoryFromHash(window.location.hash);
      if (fromHash) {
        setCategory(fromHash);
        setQuery("");
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const value = useMemo<BrowseContextValue>(
    () => ({
      category,
      query,
      selectCategory: (next) => {
        setCategory(next);
        setQuery("");
        window.history.replaceState(null, "", shopAnchor(next));
      },
      search: (next) => {
        setQuery(next.trim());
        setCategory("all");
      },
    }),
    [category, query],
  );

  return <BrowseContext.Provider value={value}>{children}</BrowseContext.Provider>;
}

export function useBrowse() {
  const browse = useContext(BrowseContext);
  if (!browse) throw new Error("useBrowse must be used inside BrowseProvider");
  return browse;
}
