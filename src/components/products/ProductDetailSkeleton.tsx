/**
 * Placeholder for the product details page while its content streams in. It mirrors the real layout
 * and is at least one screen tall on purpose: on a client navigation Next.js keeps the old scroll
 * position whenever the new page's top edge is already on screen. A short placeholder let the browser
 * clamp the scroll position to the bottom of a tiny page, Next.js then saw the page top on screen and
 * skipped its scroll-to-top, and scroll anchoring kept the visitor at the bottom once the product
 * arrived. With a full-height placeholder the page top is off screen, so Next.js scrolls to the top.
 */
export function ProductDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading product" className="min-h-svh">
      <div className="h-5 w-56 max-w-full animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
      <div className="mt-3 grid gap-5 sm:mt-5 md:grid-cols-2 md:gap-8 lg:gap-12">
        <div className="aspect-[4/3] animate-pulse rounded-3xl bg-muted motion-reduce:animate-none md:aspect-square" />
        <div className="space-y-4">
          <div className="h-4 w-24 rounded-full bg-muted" />
          <div className="h-9 w-3/4 rounded-full bg-muted" />
          <div className="h-5 w-1/2 rounded-full bg-muted" />
          <div className="h-8 w-28 rounded-full bg-muted" />
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="h-12 rounded-full bg-muted" />
            <div className="h-12 rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
