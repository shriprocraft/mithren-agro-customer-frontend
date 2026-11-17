import { Container } from "@/components/layout/Container";

const block = "animate-pulse rounded-full bg-foreground/8 motion-reduce:animate-none";

/**
 * The home page's placeholder while its live data loads: the hero (heading, text, two buttons and the
 * benefits strip, at the hero's own size), the search and the Shop by category row. It carries
 * #home-hero and #home-search, so the header lays itself over the hero and hides its own search
 * exactly as on the loaded page (SiteHeader): nothing jumps when the real page replaces it.
 */
export function HomeSkeleton() {
  return (
    <main id="main-content" className="flex-1" aria-busy="true">
      <p role="status" className="sr-only">Loading the store…</p>
      <section
        id="home-hero"
        aria-hidden="true"
        className="relative isolate -mt-28 flex flex-col overflow-hidden bg-linear-to-br from-secondary via-background to-soft lg:-mt-30 lg:h-[calc(100svh-1.875rem)] lg:max-h-[58rem] lg:min-h-[34rem]"
      >
        <div className="h-[23rem] min-[480px]:h-[27rem] sm:h-[32rem] md:h-[34rem] lg:hidden" />
        <Container className="-mt-12 pb-5 sm:-mt-16 lg:mt-0 lg:flex lg:flex-1 lg:items-center lg:pt-28 lg:pb-6 xl:px-10">
          <div className="w-full max-w-xl space-y-3 lg:max-w-[30rem] xl:max-w-xl">
            <div className={`${block} h-10 w-3/4 rounded-2xl xl:h-14`} />
            <div className={`${block} h-10 w-5/6 rounded-2xl xl:h-14`} />
            <div className={`${block} h-10 w-1/2 rounded-2xl xl:h-14`} />
            <div className={`${block} mt-5 h-4 w-11/12`} />
            <div className={`${block} h-4 w-2/3`} />
            <div className="flex gap-3 pt-4">
              <div className={`${block} h-11 w-48 xl:h-12`} />
              <div className={`${block} h-11 w-40 xl:h-12`} />
            </div>
          </div>
        </Container>
        <Container className="lg:pb-10 xl:pb-12">
          <div className="xl:px-6">
            <div className="grid grid-cols-2 gap-3 rounded-[1.25rem] border border-border bg-card/90 p-3 sm:p-4 lg:grid-cols-4 lg:py-3">
              {[0, 1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-3">
                  <div className={`${block} size-9 shrink-0 xl:size-12`} />
                  <div className={`${block} h-3 flex-1`} />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
      <section id="home-search" aria-hidden="true" className="pt-4 sm:pt-6">
        <Container>
          <div className={`${block} mx-auto h-12 max-w-2xl`} />
        </Container>
      </section>
      <section aria-hidden="true" className="pt-6 pb-10 sm:pt-8">
        <Container>
          <div className={`${block} h-7 w-56 rounded-xl`} />
          <div className="mt-5 flex gap-3 overflow-hidden md:gap-4">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="w-[9.75rem] shrink-0 space-y-2 sm:w-[10.75rem] lg:w-[11.25rem] xl:w-[12rem]">
                <div className="aspect-square animate-pulse rounded-3xl bg-foreground/8 motion-reduce:animate-none" />
                <div className={`${block} mx-auto h-3 w-2/3`} />
              </div>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
