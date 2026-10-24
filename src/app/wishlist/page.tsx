import type { Metadata } from "next";
import { WishlistView } from "@/components/checkout/WishlistView";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/typography";
import { getCatalog, getVendors } from "@/services/catalog";

export const metadata: Metadata = { title: "Your wishlist" };

export default async function WishlistPage() {
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
