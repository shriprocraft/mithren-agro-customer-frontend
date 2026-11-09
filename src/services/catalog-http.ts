import { apiEndpoints } from "@/config/api";
import { ApiError, type ApiClient } from "@/lib/api-client";
import { isCategorySlug, type Category, type Product, type Vendor } from "@/types/catalog";

// The backend catalogue (GET /catalog/*, docs/BACKEND_CONTRACTS.md). Responses already have the
// shapes in types/catalog.ts; this adapter only pages through lists and drops anything the storefront
// can't place (a category slug it doesn't know, and the products filed under it).

/** The API's largest page; the catalogue is read whole, a page at a time. */
const PAGE_SIZE = 100;

export interface CatalogReader {
  categories(): Promise<Category[]>;
  vendors(): Promise<Vendor[]>;
  products(filter?: { category?: string; seasonal?: boolean }): Promise<Product[]>;
  bundles(filter?: { comboBox?: boolean }): Promise<Product[]>;
  product(id: string): Promise<Product | undefined>;
  related(id: string, limit: number): Promise<Product[]>;
}

interface ProductPage {
  products: Product[];
  total: number;
}

export function createHttpCatalog(client: ApiClient): CatalogReader {
  async function knownCategoryIds(): Promise<Set<string>> {
    return new Set((await categories()).map((category) => category.id));
  }

  async function categories(): Promise<Category[]> {
    const response = await client.request<{ categories: Category[] }>(apiEndpoints.catalog.categories);
    return response.categories.filter((category) => isCategorySlug(category.slug));
  }

  async function keepPlaced(items: Product[]): Promise<Product[]> {
    const known = await knownCategoryIds();
    return items.filter((item) => known.has(item.category_id));
  }

  return {
    categories,

    async vendors() {
      return (await client.request<{ vendors: Vendor[] }>(apiEndpoints.catalog.vendors)).vendors;
    },

    async products(filter = {}) {
      const query: Record<string, string> = { limit: String(PAGE_SIZE) };
      if (filter.category) query.category = filter.category;
      if (filter.seasonal !== undefined) query.seasonal = String(filter.seasonal);
      const items: Product[] = [];
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const page = await client.request<ProductPage>(apiEndpoints.catalog.products, { query: { ...query, offset: String(offset) } });
        items.push(...page.products);
        if (page.products.length === 0 || items.length >= page.total) break;
      }
      return keepPlaced(items);
    },

    async bundles(filter = {}) {
      const query = filter.comboBox === undefined ? undefined : { combo_box: String(filter.comboBox) };
      return keepPlaced((await client.request<{ products: Product[] }>(apiEndpoints.catalog.bundles, { query })).products);
    },

    async product(id) {
      try {
        const item = await client.request<Product>(apiEndpoints.catalog.product(id));
        return (await keepPlaced([item]))[0];
      } catch (error) {
        // An unknown, hidden or malformed id: the page shows "not found". Anything else is a real failure.
        if (error instanceof ApiError && error.status === 404) return undefined;
        throw error;
      }
    },

    async related(id, limit) {
      try {
        const response = await client.request<{ products: Product[] }>(apiEndpoints.catalog.related(id), { query: { limit: String(limit) } });
        return keepPlaced(response.products);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return [];
        throw error;
      }
    },
  };
}
