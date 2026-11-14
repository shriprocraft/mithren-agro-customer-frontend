"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { criteriaToSearch, parseCriteria, type MarketplaceCriteria } from "@/lib/marketplace";
import { catalogSearch as defaultSearch, type CatalogSearchService } from "@/services/catalog-search";
import type { Product } from "@/types/catalog";

export type SearchState =
  | { status: "ready"; products: Product[] }
  | { status: "loading"; products: Product[] }
  | { status: "error"; products: Product[]; message: string };

const UNAVAILABLE = "We couldn't search the store right now. Check your connection and try again.";

/**
 * The marketplace results for these criteria, from the backend. The page arrives with the whole catalogue
 * (rendered on the server), which is the answer while nothing is chosen; every search, filter or sort
 * after that, and a page opened with any of them in the URL, asks the API from the browser. Only the
 * latest request may update the results, and a failure is shown as an error: results are never worked
 * out in the browser instead.
 */
export function useCatalogSearch(criteria: MarketplaceCriteria, initial: Product[], service: CatalogSearchService | null = defaultSearch) {
  const key = criteriaToSearch(criteria);
  const [state, setState] = useState<SearchState>({ status: key ? "loading" : "ready", products: initial });
  const asked = useRef(key !== "");
  const latest = useRef(0);

  const run = useCallback(
    (query: string) => {
      const request = ++latest.current;
      if (!service) {
        setState((previous) => ({ status: "error", products: previous.products, message: UNAVAILABLE }));
        return;
      }
      setState((previous) => ({ status: "loading", products: previous.products }));
      service.search(parseCriteria(new URLSearchParams(query))).then(
        (products) => {
          if (request === latest.current) setState({ status: "ready", products });
        },
        () => {
          if (request === latest.current) setState((previous) => ({ status: "error", products: previous.products, message: UNAVAILABLE }));
        },
      );
    },
    [service],
  );

  useEffect(() => {
    // Nothing chosen yet: the server's catalogue already is the answer. Once anything has been chosen,
    // every change asks the API, including clearing everything again.
    if (key === "" && !asked.current) return;
    asked.current = true;
    run(key);
  }, [key, run]);

  return { state, retry: () => run(key) };
}
