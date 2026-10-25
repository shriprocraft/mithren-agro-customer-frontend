import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { LeafMark } from "@/components/layout/LeafMark";
import { CompactProductCard } from "@/components/products/CompactProductCard";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { shopHref } from "@/lib/browse";
import type { Product } from "@/types/catalog";

interface FarmEssentialsSectionProps {
  products: Product[];
  vendorNames: Record<string, string>;
}

// Large version of the reference's fertilizer banner: copy and listings on the panel, seedling
// photograph fading in from the right. Copy avoids specifications, certifications, safety claims
// and usage instructions.
export function FarmEssentialsSection({ products, vendorNames }: FarmEssentialsSectionProps) {
  return (
    <section id="farm-essentials" aria-labelledby="farm-title" className="scroll-mt-4 py-6 sm:py-8 lg:scroll-mt-32">
      <Container>
        <div className="surface-card relative isolate overflow-hidden rounded-3xl">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-56 [mask-image:linear-gradient(to_bottom,#000_40%,transparent)] lg:inset-y-0 lg:right-0 lg:left-auto lg:h-auto lg:w-[52%] lg:banner-photo-fade">
            <Image src="/images/home/farm-essentials.jpg" alt="" fill sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" />
          </div>
          <div className="relative p-6 pt-48 sm:p-8 sm:pt-52 lg:max-w-[58%] lg:p-10">
            <LeafMark className="absolute top-9 left-4 hidden h-12 w-9 -rotate-[22deg] lg:block" />
            <div className="lg:pl-8">
              <p className="text-xs font-semibold tracking-wide text-brand uppercase">Fertilizers &amp; farm essentials</p>
              <Heading id="farm-title" variant="h2" className="mt-1.5">
                Supplies for gardens and fields
              </Heading>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Compost, potting mixes and soil inputs from agri-supply sellers, in the same cart as your groceries.
              </p>
              <Button asChild className="mt-5">
                <Link href={shopHref("fertilizers")}>
                  Explore fertilizers
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {products.map((product) => (
                <li key={product.id}>
                  <CompactProductCard product={product} vendorName={vendorNames[product.vendor_id] ?? "Independent seller"} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
