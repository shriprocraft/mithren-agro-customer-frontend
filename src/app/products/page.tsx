import { Suspense } from "react";
import type { Metadata } from "next";
import { Layers, Store, Tags } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { Marketplace } from "@/components/marketplace/Marketplace";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";
import { Heading, Text } from "@/components/ui/typography";
import { getCatalog, getCategories, getVendors } from "@/services/catalog";

export const metadata: Metadata = { title: "Shop all products" };

export default async function ProductsPage() {
  const [products, categories, vendors] = await Promise.all([getCatalog(), getCategories(), getVendors()]);
  const vendorNames = Object.fromEntries(vendors.map((v) => [v.id, v.name]));
  // The summary beside the heading uses counts from the catalogue itself, nothing more.
  const sellerCount = new Set(products.map((p) => p.vendor_id)).size;
  const stats = [
    { Icon: Tags, value: products.length, label: "listings" },
    { Icon: Layers, value: categories.length, label: "categories" },
    { Icon: Store, value: sellerCount, label: "sellers" },
  ];

  return (
    <main id="main-content" className="flex-1">
      <Container className="pt-4 pb-8 sm:py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
        <div className="mt-2 flex flex-col gap-4 sm:mt-3 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <Heading as="h1" variant="h1" className="text-[1.625rem] sm:text-4xl">Shop the marketplace</Heading>
            <Text variant="muted" className="mt-1.5 sm:text-base">
              Fresh produce, pantry staples, farm supplies and apparel from independent sellers, in one cart. Search, pick a category, sort or
              filter. All products, prices and sellers are sample data.
            </Text>
          </div>
          <dl aria-label="Marketplace at a glance" className="grid shrink-0 grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-soft py-2.5 sm:max-w-md lg:w-96">
            {stats.map(({ Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5 px-2 text-center sm:flex-row sm:justify-center sm:gap-2.5">
                <Icon className="size-4 text-brand max-sm:hidden" aria-hidden="true" />
                {/* dt before dd as <dl> requires; flex-col-reverse puts the number on top. */}
                <div className="flex flex-col-reverse">
                  <dt className="mt-0.5 text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-heading text-lg leading-none font-semibold sm:text-xl">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-4 sm:mt-6">
          {/* The results read the URL, so they render on the client inside this boundary. */}
          {/* At least a screen tall, so navigations here start at the top (see ProductDetailSkeleton). */}
          <Suspense fallback={<ProductGridSkeleton className="min-h-svh" />}>
            <Marketplace products={products} categories={categories} vendorNames={vendorNames} />
          </Suspense>
        </div>
      </Container>
    </main>
  );
}
