import type { Metadata } from "next";
import { AddressStep } from "@/components/checkout/AddressStep";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/typography";
import { getCatalog } from "@/services/catalog";

export const metadata: Metadata = { title: "Delivery address" };

export default async function AddressPage() {
  const catalog = await getCatalog();
  return (
    <main id="main-content" className="flex-1">
      <Container className="max-w-3xl py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Address" }]} />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <Heading as="h1" variant="h1">Delivery address</Heading>
          <CheckoutSteps current="Address" />
        </div>
        <div className="mt-6">
          <AddressStep catalog={catalog} />
        </div>
      </Container>
    </main>
  );
}
