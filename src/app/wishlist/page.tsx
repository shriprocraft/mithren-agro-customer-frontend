import { Suspense } from "react";
import { PageLoading } from "@/components/layout/PageLoading";
import type { Metadata } from "next";
import { WishlistView } from "@/components/checkout/WishlistView";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/typography";
import { getCatalog, getVendors } from "@/services/catalog";

export const metadata: Metadata = { title: "Your wishlist" };

async function WishlistPageContent() {
  const [catalog, vendors] = await Promise.all([getCatalog(), getVendors()]);
  const vendorNames = Object.fromEntries(vendors.map((v) => [v.id, v.name]));
  return (
    <main id="main-content" className="flex-1">
      <Container className="py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />
        <Heading as="h1" variant="h1" className="mt-3">Your wishlist</Heading>
        <div className="mt-6">
          <WishlistView catalog={catalog} vendorNames={vendorNames} />
        </div>
      </Container>
    </main>
  );
}

// The data comes live from the backend on every request, so it loads inside this boundary: the page
// streams with a loading state instead of blocking navigation.
export default function WishlistPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading your wishlist…" />}>
      <WishlistPageContent />
    </Suspense>
  );
}
