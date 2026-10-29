import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { LeafMark } from "@/components/layout/LeafMark";
import { shopHref } from "@/lib/browse";

// The reference's twin banners: copy on a light panel, photograph fading in from the right.
// Copy describes what is listed; it makes no quality, nutrition or yield claims.
const banners = [
  {
    href: "/#combo-offers",
    lead: "Fruit & Veg",
    accent: "Combo Boxes",
    text: "Mixed fruit and vegetable boxes.",
    cta: "Shop combos",
    image: { src: "/images/products/vegetable-basket.jpg", position: "object-[50%_40%]" },
  },
  {
    href: shopHref("fertilizers"),
    lead: "Fertilizers &",
    accent: "Farm Essentials",
    text: "Compost, potting mix and soil inputs.",
    cta: "Shop fertilizers",
    image: { src: "/images/products/garden-compost.jpg", position: "object-[50%_45%]" },
  },
];

export function PromoBanners() {
  return (
    <section aria-label="Featured collections" className="py-3 sm:py-4">
      <Container className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {banners.map((banner) => (
          <Link
            key={banner.href}
            href={banner.href}
            className="group surface-card relative isolate flex min-h-36 overflow-hidden rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-[62%] banner-photo-fade">
              <Image
                src={banner.image.src}
                alt=""
                fill
                sizes="(min-width: 768px) 400px, 62vw"
                loading="eager"
                className={`object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none ${banner.image.position}`}
              />
            </span>
            <LeafMark className="absolute top-6 left-5 hidden h-12 w-9 -rotate-[22deg] sm:block" />
            <LeafMark className="absolute bottom-4 left-8 hidden h-9 w-7 rotate-[18deg] opacity-30 sm:block" />
            <span className="relative flex max-w-[60%] flex-col items-start justify-center py-4 pr-4 pl-5 sm:pl-20">
              <span className="font-heading text-xl leading-tight font-semibold text-foreground sm:text-[1.375rem]">
                {banner.lead}
                <span className="block font-medium text-primary">{banner.accent}</span>
              </span>
              <span className="mt-1.5 text-[0.8125rem] leading-snug text-muted-foreground">{banner.text}</span>
              <span className="surface-primary mt-3 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-primary-foreground transition group-hover:bg-primary-hover">
                {banner.cta}
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </span>
          </Link>
        ))}
      </Container>
    </section>
  );
}
