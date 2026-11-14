import { Suspense } from "react";
import { PageLoading } from "@/components/layout/PageLoading";
import type { Metadata } from "next";
import { CartView } from "@/components/checkout/CartView";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/typography";
import { getCatalog, getVendors } from "@/services/catalog";

export const metadata: Metadata = { title: "Your cart" };

async function CartPageContent() {
  const [catalog, vendors] = await Promise.all([getCatalog(), getVendors()]);
  const vendorNames = Object.fromEntries(vendors.map((v) => [v.id, v.name]));

  return (
    <main id="main-content" className="flex-1">
      <Container className="py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <Heading as="h1" variant="h1">Your cart</Heading>
          <CheckoutSteps current="Cart" />
        </div>
        <div className="mt-6">
          <CartView catalog={catalog} vendorNames={vendorNames} />
        </div>
      </Container>
    </main>
  );
}

// The data comes live from the backend on every request, so it loads inside this boundary: the page
// streams with a loading state instead of blocking navigation.
export default function CartPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading your cart…" />}>
      <CartPageContent />
    </Suspense>
  );
}
