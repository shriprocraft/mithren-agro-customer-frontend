import type { Metadata } from "next";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { ReviewStep } from "@/components/checkout/ReviewStep";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/typography";
import { getCatalog } from "@/services/catalog";

export const metadata: Metadata = { title: "Review your order" };

export default async function ReviewPage() {
  const catalog = await getCatalog();
  return (
    <main id="main-content" className="flex-1">
      <Container className="py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Address", href: "/checkout/address" }, { label: "Review" }]} />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <Heading as="h1" variant="h1">Review your order</Heading>
          <CheckoutSteps current="Review" />
        </div>
        <div className="mt-6">
          <ReviewStep catalog={catalog} />
        </div>
      </Container>
    </main>
  );
}
