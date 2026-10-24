import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { LeafMark } from "@/components/layout/LeafMark";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { shopHref } from "@/lib/browse";

// Closing banner in the reference's light style: the market photograph fills the panel and a
// frosted wash from the left carries dark copy and one call to action.
export function MarketplaceBanner() {
  return (
    <section aria-labelledby="banner-title" className="py-6">
      <Container>
        <div className="surface-card relative isolate flex min-h-64 items-center overflow-hidden rounded-3xl">
          <Image
            src="/images/home/marketplace-banner.jpg"
            alt="Market stall with crates of colourful fruit and vegetables"
            fill
            sizes="(min-width: 1344px) 1280px, 100vw"
            className="-z-20 object-cover"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-linear-to-r from-white/90 via-white/75 to-white/0 sm:via-white/60"
          />
          <LeafMark className="absolute top-8 left-5 hidden h-12 w-9 -rotate-[22deg] sm:block" />
          <div className="max-w-xl p-6 sm:py-10 sm:pr-10 sm:pl-20">
            <p className="text-xs font-semibold tracking-wide text-brand uppercase">One marketplace</p>
            <Heading id="banner-title" variant="h2" className="mt-1.5 lg:text-3xl">
              For the kitchen, the garden and the wardrobe
            </Heading>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              Browse all five categories and add items from different sellers to the same cart.
            </p>
            <Button asChild className="mt-6">
              <a href={shopHref("all")}>
                Browse the marketplace
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
