import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Handshake } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ValueStrip } from "@/components/home/ValueStrip";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";

// Supplied by Mithren Agro (public/images/Mithren_Agro_Hero_6K_6000x3375.png, see docs/IMAGE_CREDITS.md),
// served from a 2880×1620 export. 16:9: sky and trees across the top, open field rows on the left, the
// branded crate centre-right (x ≈ 40–91%, y ≈ 20–85% of the frame).
const heroPhoto = {
  src: "/images/home/mithren-hero-crate.jpg",
  alt: "Wooden Mithren Agro crate overflowing with lettuce, carrots, tomatoes, peppers and cucumbers in a sunlit field",
  width: 2880,
  height: 1620,
};

// The homepage opens with this photograph directly under the announcement bar. SiteHeader detects
// #home-hero and lays itself over the top of it: the header keeps a fixed height there (h-28 on phones,
// h-30 from lg) and this section pulls up by the same amount (-mt-28 / lg:-mt-30), with the copy padded
// to clear it. Keep the two in step.
//
// Phones and tablets: the photograph is a full-bleed band (the header over its sky), centred on the
// crate, fading into the page; the copy and actions follow below it. From lg the photograph fills the
// whole first screen (minus the announcement bar, capped 44–58rem) and the copy sits on the open field
// (the photo is positioned left of centre, and from xl its box starts 7% in, so the crate sits towards
// the right) on the left behind a soft light wash that clears before the crate. From xl the copy lines up
// with the logo (the header's xl:px-10 gutter). The benefits strip runs along the
// bottom. One image element at every width, so the LCP image is never downloaded twice.
export function HeroSection() {
  return (
    <section
      id="home-hero"
      aria-labelledby="hero-title"
      className="relative isolate -mt-28 overflow-hidden bg-background lg:-mt-30 lg:flex lg:h-[calc(100svh-1.875rem)] lg:max-h-[58rem] lg:min-h-[44rem] lg:flex-col"
    >
      <div className="relative h-[23rem] min-[480px]:h-[27rem] sm:h-[32rem] md:h-[34rem] lg:absolute lg:inset-y-0 lg:right-0 lg:left-0 lg:-z-10 lg:h-auto xl:left-[7%] xl:[mask-image:linear-gradient(to_right,transparent,black_16%)]">
        <Image
          src={heroPhoto.src}
          alt={heroPhoto.alt}
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-[62%_60%] sm:object-[56%_60%] lg:object-[38%_60%] xl:object-[16%_60%]"
        />
        {/* A light wash under the header keeps the logo and controls crisp against the sky. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/85 via-white/45 to-transparent sm:from-white/70 sm:via-white/30 lg:h-40" />
        {/* Phones and tablets: the band fades into the page where the copy begins. */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-background via-background/70 to-transparent lg:hidden" />
      </div>
      {/* From lg: a light wash over the field on the left for the copy, clear before the crate. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,color-mix(in_oklab,var(--background),transparent_4%)_0%,color-mix(in_oklab,var(--background),transparent_18%)_30%,color-mix(in_oklab,var(--background),transparent_70%)_46%,transparent_60%)] lg:block"
      />

      <Container className="relative -mt-12 pb-5 sm:-mt-16 sm:pb-7 lg:mt-0 lg:flex lg:flex-1 lg:items-center lg:pt-32 lg:pb-6 xl:px-10">
        <div className="max-w-xl animate-in duration-500 fade-in slide-in-from-bottom-3 motion-reduce:animate-none lg:max-w-[30rem] xl:max-w-xl">
          <Heading as="h1" id="hero-title" variant="display">
            Good Food
            <span className="block">Grows a Better</span>
            <span className="block text-primary">Tomorrow</span>
          </Heading>
          <p className="mt-3 max-w-[24rem] text-[0.9375rem] leading-relaxed text-pretty text-foreground/85 sm:mt-4 sm:text-base lg:max-w-[23rem] xl:mt-5 xl:max-w-[30rem] xl:text-[1.0625rem]">
            Shop fresh produce, pantry essentials and more from independent sellers, all in one place.
          </p>
          <div className="mt-5 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:gap-3 xl:mt-8 xl:gap-4">
            <Button asChild className="px-6 xl:h-12 xl:px-8">
              <Link href="/investors">
                Investor Opportunities
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="bg-card/90 pr-6 pl-2 xl:h-12 xl:pr-8 xl:pl-2.5">
              <Link href="/agent-benefits">
                <span className="grid size-7 place-items-center rounded-full ring-1 ring-foreground/20">
                  <Handshake className="size-3.5 text-brand" aria-hidden="true" />
                </span>
                Agent Benefits
              </Link>
            </Button>
          </div>
        </div>
      </Container>

      <div className="relative lg:pb-6 xl:pb-7">
        <ValueStrip />
      </div>
    </section>
  );
}
