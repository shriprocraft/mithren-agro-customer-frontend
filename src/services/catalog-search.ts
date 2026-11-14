import { apiBaseUrl, apiEndpoints } from "@/config/api";
import { createApiClient, type ApiClient } from "@/lib/api-client";
import type { MarketplaceCriteria, SortOption } from "@/lib/marketplace";
import type { Product } from "@/types/catalog";

// Marketplace search, filters and sort, answered by the backend (GET /catalog/products with
// include_bundles, so combo boxes are searched too). Called from the browser, so every search is a
// request the customer's browser makes. The API's rules match lib/marketplace.ts.

const PAGE_SIZE = 100;
const SORTS: Record<SortOption, string> = { relevance: "relevance", "price-asc": "price_asc", "price-desc": "price_desc", "name-asc": "name_asc" };

/** The API query for marketplace criteria. Prices: whole rupees in the URL, paise in the API. */
export function searchQuery(criteria: MarketplaceCriteria): Record<string, string> {
  const query: Record<string, string> = { include_bundles: "true", sort: SORTS[criteria.sort] };
  if (criteria.query) query.q = criteria.query;
  if (criteria.categories.length) query.category = criteria.categories.join(",");
  if (criteria.minPrice != null) query.min_price = String(criteria.minPrice * 100);
  if (criteria.maxPrice != null) query.max_price = String(criteria.maxPrice * 100);
  if (criteria.availability.length) query.stock = criteria.availability.join(",");
  if (criteria.sellers.length) query.vendor = criteria.sellers.join(",");
  if (criteria.units.length) query.unit = criteria.units.join(",");
  if (criteria.seasonal) query.seasonal = "true";
  if (criteria.onSale) query.on_sale = "true";
  return query;
}

export interface CatalogSearchService {
  search(criteria: MarketplaceCriteria): Promise<Product[]>;
}

export function createHttpCatalogSearch(client: ApiClient): CatalogSearchService {
  return {
    async search(criteria) {
      const query = searchQuery(criteria);
      const items: Product[] = [];
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const page = await client.request<{ products: Product[]; total: number }>(apiEndpoints.catalog.products, {
          query: { ...query, limit: String(PAGE_SIZE), offset: String(offset) },
        });
        items.push(...page.products);
        if (page.products.length === 0 || items.length >= page.total) return items;
      }
    },
  };
}

/** The search service, or null when NEXT_PUBLIC_API_BASE_URL isn't set (the shop then shows an error). */
export const catalogSearch: CatalogSearchService | null = apiBaseUrl ? createHttpCatalogSearch(createApiClient(apiBaseUrl)) : null;
