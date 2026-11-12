import { apiBaseUrl } from "@/config/api";

// Where catalogue data comes from, readable on the server and in the browser (it holds no secret).
// "backend": the customer API (GET /catalog/*, and POST /checkout/quote for prices at checkout),
// chosen with NEXT_PUBLIC_CATALOG_SOURCE=backend and a valid NEXT_PUBLIC_API_BASE_URL.
// "sample": the mock data in src/data, priced in the browser (lib/cart.ts).

export type CatalogSource = "backend" | "sample";

export function resolveCatalogSource(config: { source: string | undefined; apiBaseUrl: string | null }): CatalogSource {
  return config.source === "backend" && config.apiBaseUrl ? "backend" : "sample";
}

export const catalogSource = resolveCatalogSource({ source: process.env.NEXT_PUBLIC_CATALOG_SOURCE, apiBaseUrl });
