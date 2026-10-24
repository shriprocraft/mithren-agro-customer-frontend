"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SearchX } from "lucide-react";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ShopCategoryFilter } from "@/components/home/ShopCategoryFilter";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { motionTokens } from "@/config/motion";
import { useBrowse } from "@/context/BrowseContext";
import { groupBy, roundRobin } from "@/lib/collections";
import { filterProducts } from "@/lib/filters";
import type { Category, Product } from "@/types/catalog";

interface ShopBrowserProps {
  products: Product[];
  categories: Category[];
  vendorNames: Record<string, string>;
}

const INITIAL_ALL_COUNT = 10;

// Target of the header search and every category link until /products and /search exist.
export function ShopBrowser({ products, categories, vendorNames }: ShopBrowserProps) {
  const { category, query, selectCategory, search } = useBrowse();
  const [showEverything, setShowEverything] = useState(false);

  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const activeCategory = categories.find((c) => c.slug === category);
  // "All" mixes categories so the browser doesn't repeat the produce-only "Fresh picks" row above it.
  const mixed = roundRobin(groupBy(products, (p) => p.category_id));
  const matches = filterProducts(mixed, { query, categoryId: activeCategory?.id ?? null }, { vendorNames, categoryNames });
  const isCapped = category === "all" && !query && !showEverything && matches.length > INITIAL_ALL_COUNT;
  const visible = isCapped ? matches.slice(0, INITIAL_ALL_COUNT) : matches;

  const options = [
    { value: "all" as const, label: "All", count: products.length },
    ...categories.map((c) => ({
      value: c.slug,
      label: c.name,
      count: products.filter((p) => p.category_id === c.id).length,
    })),
  ];

  const status = query
    ? `${matches.length} ${matches.length === 1 ? "result" : "results"} for “${query}”`
    : `${matches.length} products${activeCategory ? ` in ${activeCategory.name}` : ""}`;

  return (
    <section id="shop" aria-labelledby="shop-title" className="scroll-mt-4 py-8 lg:scroll-mt-32">
      <Container>
        <SectionHeading
          id="shop-title"
          title="Shop the marketplace"
          description="Browse every category, or search from the bar at the top. All listings are sample data."
        />
        <ShopCategoryFilter options={options} value={category} onChange={selectCategory} />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p id="shop-results" tabIndex={-1} aria-live="polite" className="text-sm font-medium text-muted-foreground outline-none">
            {status}
          </p>
          {query && (
            <Button variant="ghost" onClick={() => search("")}>
              Clear search
            </Button>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="surface-card mt-6 flex flex-col items-center gap-3 rounded-3xl px-6 py-12 text-center">
            <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-heading text-lg font-medium">No products match “{query}”</p>
            <p className="max-w-sm text-sm text-muted-foreground">Try a product, seller or category name, such as “dal” or “compost”.</p>
            <Button variant="outline" onClick={() => search("")}>Show all products</Button>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((product) => (
                <motion.li
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease }}
                >
                  <ProductCard
                    product={product}
                    vendorName={vendorNames[product.vendor_id] ?? "Independent seller"}
                    sizes="(min-width: 1280px) 230px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        {isCapped && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" onClick={() => setShowEverything(true)}>
              Show all {matches.length} products
            </Button>
          </div>
        )}
      </Container>
    </section>
  );
}
