"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ShopCategoryFilter } from "@/components/home/ShopCategoryFilter";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { motionTokens } from "@/config/motion";
import { shopHref, type BrowseCategory } from "@/lib/browse";
import { groupBy, roundRobin } from "@/lib/collections";
import type { Category, Product } from "@/types/catalog";

interface ShopBrowserProps {
  products: Product[];
  categories: Category[];
  vendorNames: Record<string, string>;
}

const INITIAL_ALL_COUNT = 10;

// Homepage preview of the catalogue with quick category chips. Search, filters and sorting live on
// the marketplace (/products), which the header search and every category link open.
export function ShopBrowser({ products, categories, vendorNames }: ShopBrowserProps) {
  const [category, setCategory] = useState<BrowseCategory>("all");
  const [showEverything, setShowEverything] = useState(false);

  const activeCategory = categories.find((c) => c.slug === category);
  // "All" mixes categories so the preview doesn't repeat the produce-only "Fresh picks" row above it.
  const matches = activeCategory
    ? products.filter((p) => p.category_id === activeCategory.id)
    : roundRobin(groupBy(products, (p) => p.category_id));
  const isCapped = !activeCategory && !showEverything && matches.length > INITIAL_ALL_COUNT;
  const visible = isCapped ? matches.slice(0, INITIAL_ALL_COUNT) : matches;

  const options = [
    { value: "all" as const, label: "All", count: products.length },
    ...categories.map((c) => ({
      value: c.slug,
      label: c.name,
      count: products.filter((p) => p.category_id === c.id).length,
    })),
  ];

  return (
    <section id="shop" aria-labelledby="shop-title" className="scroll-mt-4 py-8 lg:scroll-mt-32">
      <Container>
        <SectionHeading
          id="shop-title"
          title="Shop the marketplace"
          description="A quick look across every category. All listings are sample data."
          action={{ href: "/products", label: "Search & filter all products" }}
        />
        <ShopCategoryFilter options={options} value={category} onChange={setCategory} />
        <p aria-live="polite" className="mt-5 text-sm font-medium text-muted-foreground">
          {matches.length} products{activeCategory ? ` in ${activeCategory.name}` : ""}
        </p>

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

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {isCapped && (
            <Button variant="outline" onClick={() => setShowEverything(true)}>
              Show all {matches.length} products
            </Button>
          )}
          <Button asChild>
            <a href={shopHref(category)}>
              <SlidersHorizontal aria-hidden="true" />
              Filter and sort in the marketplace
            </a>
          </Button>
        </div>
      </Container>
    </section>
  );
}
