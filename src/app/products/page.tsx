import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { Marketplace } from "@/components/marketplace/Marketplace";
import { Heading, Text } from "@/components/ui/typography";
import { getCatalog, getCategories, getVendors } from "@/services/catalog";

export const metadata: Metadata = { title: "Shop all products" };

export default async function ProductsPage() {
  const [products, categories, vendors] = await Promise.all([getCatalog(), getCategories(), getVendors()]);
  const vendorNames = Object.fromEntries(vendors.map((v) => [v.id, v.name]));

  return (
    <main id="main-content" className="flex-1">
      <Container className="py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
        <Heading as="h1" variant="h1" className="mt-3">Shop the marketplace</Heading>
        <Text variant="muted" className="mt-1 text-base">
          Search, filter and sort every listing. All products, prices and sellers are sample data.
        </Text>
        <div className="mt-6">
          {/* The results read the URL, so they render on the client inside this boundary. */}
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading products…</p>}>
            <Marketplace products={products} categories={categories} vendorNames={vendorNames} />
          </Suspense>
        </div>
      </Container>
    </main>
  );
}
