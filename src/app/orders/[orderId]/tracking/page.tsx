import { Suspense } from "react";
import type { Metadata } from "next";
import { LoadingState } from "@/components/checkout/PageState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { TrackingView } from "@/components/orders/TrackingView";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackingPage({ params }: PageProps<"/orders/[orderId]/tracking">) {
  return (
    <main id="main-content" className="flex-1">
      <Container className="py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Order tracking" }]} />
        <div className="mt-4">
          <Suspense fallback={<LoadingState label="Loading your order…" />}>
            <TrackingView params={params} />
          </Suspense>
        </div>
      </Container>
    </main>
  );
}
