import Image from "next/image";
import { ArrowRight, Truck } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { MeetFarmersButton } from "@/components/home/MeetFarmersButton";
import { ValueStrip } from "@/components/home/ValueStrip";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";

// Generated for Mithren Agro by the owner (see docs/IMAGE_CREDITS.md). 1536×1024: open, bright haze
// on the left for the copy; the crate fills the right ~65% (x 640–1480, y 250–880 in the source).
const heroPhoto = {
  src: "/images/mithren-hero-produce.png",
  alt: "Wooden crate of fresh vegetables on a rustic table in front of a sunlit field",
  width: 1536,
  height: 1024,
};

interface HeroSectionProps {
  /** Names of the sample sellers who list fruit and vegetables. */
  growers: string[];
}

// Landing hero: copy on the photograph's open left side, the crate as the focal point on the right,
// one floating glass card, and the benefits strip along the bottom. "Shop by category" is the next
// section, never part of the hero.
//
// From lg the hero fills the first screen (minus the announcement bar, capped 40–58rem) and runs up
// under the glass header (-mt/pt match SiteHeader's lg:h-23 xl:h-29). The photo is anchored right
// at its own 3:2 ratio (width = 1.5 × height, capped at the viewport), so it is never cropped
// vertically on wide screens; on narrower screens object-right crops only the empty haze on its left.
// At 1024–1279px it is 88% of the hero's height, which moves the crate right, clear of the copy.
// The crate's bottom edge stays above the strip at 1024–1920px widths. Below lg the same image
// element becomes a full-bleed band under the copy, centred on the crate (one element, so the LCP
// image is never downloaded twice). On phones the copy, band and strip are kept short so "Shop by
// category" starts near the first screen.
export function HeroSection({ growers }: HeroSectionProps) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden lg:-mt-23 lg:flex lg:h-[calc(100svh-1.75rem)] lg:max-h-[58rem] lg:min-h-[40rem] lg:flex-col lg:pt-23 xl:-mt-29 xl:h-[calc(100svh-1.875rem)] xl:pt-29"
    >
      <Container className="relative pt-5 pb-4 sm:pt-10 sm:pb-6 lg:flex lg:flex-1 lg:items-center lg:py-6 xl:pl-[6.75rem]">
        <div className="max-w-xl animate-in duration-500 fade-in slide-in-from-bottom-3 motion-reduce:animate-none">
          <Heading as="h1" id="hero-title" variant="display">
            Good Food
            <span className="block">Grows a Better</span>
            <span className="block text-primary">Tomorrow</span>
          </Heading>
          <p className="mt-3 max-w-[24rem] text-[0.9375rem] leading-relaxed text-pretty text-foreground/80 sm:mt-4 sm:text-base lg:max-w-[21rem] xl:mt-5 xl:max-w-[30rem] xl:text-[1.0625rem]">
            Shop fresh produce, pantry essentials and more from independent sellers, all in one place.
          </p>
          <div className="mt-5 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:gap-3 xl:mt-8 xl:gap-4">
            <Button asChild className="px-6 xl:h-12 xl:px-8">
              <a href="#fresh-picks">
                Shop Fresh Produce
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <MeetFarmersButton growers={growers} />
          </div>
        </div>

        {/* Floating glass card over the bright trees at the photo's top right. Delivery speed and
            areas are not established in this preview, so it points to the location selector
            rather than promising delivery slots. */}
        <p className="glass-panel absolute top-6 right-8 hidden items-center gap-3.5 rounded-[2rem] py-2.5 pr-8 pl-2.5 lg:flex xl:top-8 xl:right-[1.125rem]">
          <span className="glass-chip grid size-11 place-items-center rounded-full xl:size-12">
            <Truck className="size-5 text-foreground" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <span className="text-[0.8125rem] leading-snug">
            <span className="block font-semibold">Delivery by area</span>
            <span className="block text-muted-foreground">Set your location above</span>
          </span>
        </p>
      </Container>

      <div className="relative aspect-[2/1] w-full [mask-image:linear-gradient(to_bottom,transparent,#000_12%,#000_92%,transparent)] sm:aspect-[16/9] lg:absolute lg:right-0 lg:bottom-0 lg:-z-10 lg:aspect-[3/2] lg:h-[88%] lg:w-auto xl:h-full lg:max-w-full lg:hero-photo-fade">
        <Image
          src={heroPhoto.src}
          alt={heroPhoto.alt}
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 1024px) 90vw, 100vw"
          className="object-cover object-[78%_62%] sm:object-[72%_58%] lg:object-right"
        />
      </div>
      {/* A light veil over the photo's left third keeps the headline crisp where it overlaps the haze;
          it is fully transparent before the crate begins, so the produce keeps its colour. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_oklab,var(--background),transparent_45%)_26%,transparent_46%)] lg:block"
      />

      <div className="relative -mt-3 sm:-mt-6 lg:mt-0 lg:pb-6 xl:pb-7">
        <ValueStrip />
      </div>
    </section>
  );
}
