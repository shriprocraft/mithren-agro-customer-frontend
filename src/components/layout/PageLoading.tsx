import { LoadingState } from "@/components/checkout/PageState";
import { Container } from "@/components/layout/Container";

/**
 * A page's placeholder while its live data loads from the backend (the Suspense fallback of pages that
 * read the catalogue). Full height, so navigations start at the top (see ProductDetailSkeleton).
 */
export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <main id="main-content" className="flex-1">
      <Container className="pt-4 pb-10 sm:pt-6">
        <LoadingState label={label} fullHeight />
      </Container>
    </main>
  );
}
