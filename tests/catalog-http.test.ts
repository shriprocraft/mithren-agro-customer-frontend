import { describe, expect, it, vi } from "vitest";
import { ApiError, type ApiClient } from "@/lib/api-client";
import { categorySlugOf, imageShapeFor } from "@/lib/catalog-display";
import { createHttpCatalog } from "@/services/catalog-http";
import type { Category, Product } from "@/types/catalog";

const image = { src: "/c.jpg", alt: "Category" };
const fruits: Category = { id: "c-1", slug: "fruits", name: "Fruits", short_description: "", image };
const apparel: Category = { id: "c-2", slug: "womens-apparel", name: "Women Apparels", short_description: "", image };
const unknown = { id: "c-9", slug: "gadgets", name: "Gadgets", short_description: "", image } as unknown as Category;

function product(id: string, category_id = fruits.id): Product {
  return { id, slug: id, name: id, description: "", category_id, vendor_id: "v-1", images: [], unit: "1 kg", price: 1000, stock_status: "in_stock" };
}

/** A fake API: answers by path, records each call's path and query. */
function fakeClient(routes: Record<string, (query?: Record<string, string>) => unknown>) {
  const calls: { path: string; query?: Record<string, string> }[] = [];
  const client: ApiClient = {
    async request<T>(path: string, options?: { query?: Record<string, string> }) {
      calls.push({ path, query: options?.query });
      const route = routes[path];
      if (!route) throw new ApiError("product_not_found", "Not found", 404);
      return route(options?.query) as T;
    },
  };
  return { client, calls };
}

const categoriesRoute = { "/catalog/categories": () => ({ categories: [fruits, apparel, unknown] }) };

describe("HTTP catalogue", () => {
  it("keeps every category the backend lists (no hardcoded list), and drops products in unlisted ones", async () => {
    const { client } = fakeClient({
      ...categoriesRoute,
      "/catalog/products": () => ({ products: [product("a"), product("b", unknown.id), product("c", "c-unlisted")], total: 3 }),
    });
    const catalog = createHttpCatalog(client);
    expect((await catalog.categories()).map((c) => c.slug)).toEqual(["fruits", "womens-apparel", "gadgets"]);
    expect((await catalog.products()).map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("reads every page of products and passes the filters", async () => {
    const pages = [Array.from({ length: 100 }, (_, i) => product(`p${i}`)), [product("last")]];
    const { client, calls } = fakeClient({
      ...categoriesRoute,
      "/catalog/products": (query) => ({ products: pages[Number(query!.offset) / 100] ?? [], total: 101 }),
    });
    const items = await createHttpCatalog(client).products({ category: "fruits", seasonal: true });
    expect(items).toHaveLength(101);
    const productCalls = calls.filter((call) => call.path === "/catalog/products");
    expect(productCalls.map((call) => call.query)).toEqual([
      { limit: "100", category: "fruits", seasonal: "true", offset: "0" },
      { limit: "100", category: "fruits", seasonal: "true", offset: "100" },
    ]);
  });

  it("asks for combo boxes only when requested", async () => {
    const { client, calls } = fakeClient({ ...categoriesRoute, "/catalog/bundles": () => ({ products: [product("box")] }) });
    await createHttpCatalog(client).bundles({ comboBox: true });
    await createHttpCatalog(client).bundles();
    const bundleCalls = calls.filter((call) => call.path === "/catalog/bundles");
    expect(bundleCalls.map((call) => call.query)).toEqual([{ combo_box: "true" }, undefined]);
  });

  it("treats an unknown product as not found, but lets real failures through", async () => {
    const { client } = fakeClient(categoriesRoute);
    const catalog = createHttpCatalog(client);
    await expect(catalog.product("p-tomatoes")).resolves.toBeUndefined();
    await expect(catalog.related("p-tomatoes", 4)).resolves.toEqual([]);

    const failing: ApiClient = { request: vi.fn().mockRejectedValue(new ApiError("service_unavailable", "Down", 503)) };
    await expect(createHttpCatalog(failing).product("x")).rejects.toMatchObject({ status: 503 });
  });

  it("reads one product and its related items by id", async () => {
    const { client, calls } = fakeClient({
      ...categoriesRoute,
      "/catalog/products/abc": () => product("abc"),
      "/catalog/products/abc/related": () => ({ products: [product("x"), product("y")] }),
    });
    const catalog = createHttpCatalog(client);
    expect((await catalog.product("abc"))?.id).toBe("abc");
    expect((await catalog.related("abc", 2)).map((p) => p.id)).toEqual(["x", "y"]);
    expect(calls.find((call) => call.path.endsWith("/related"))?.query).toEqual({ limit: "2" });
  });
});

describe("category display rules", () => {
  it("match on the slug, not the id", () => {
    expect(imageShapeFor(product("kurta", apparel.id), [fruits, apparel])).toBe("portrait");
    expect(imageShapeFor(product("mango"), [fruits, apparel])).toBe("square");
    expect(imageShapeFor(product("kurta", "cat-womens-apparel"), [fruits, apparel])).toBe("square");
    expect(categorySlugOf(apparel.id, [fruits, apparel])).toBe("womens-apparel");
    expect(categorySlugOf("nope", [fruits])).toBeUndefined();
  });
});
