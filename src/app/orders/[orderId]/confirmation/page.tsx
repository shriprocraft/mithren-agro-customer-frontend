import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { LoadingState } from "@/components/checkout/PageState";
import { Container } from "@/components/layout/Container";
import { ConfirmationView } from "@/components/orders/ConfirmationView";

export const metadata: Metadata = { title: "Order confirmation" };

export default function ConfirmationPage({ params }: PageProps<"/orders/[orderId]/confirmation">) {
  return (
    <main id="main-content" className="flex-1">
      <Container className="py-8">
        <CheckoutSteps current="Confirmation" />
        <div className="mt-6">
          {/* The order lives in browser storage, so the page shell is static and the order loads on the client. */}
          <Suspense fallback={<LoadingState label="Loading your order…" fullHeight />}>
            <ConfirmationView params={params} />
          </Suspense>
        </div>
      </Container>
    </main>
  );
}
