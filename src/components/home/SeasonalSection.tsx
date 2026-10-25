import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { LeafMark } from "@/components/layout/LeafMark";
import { CompactProductCard } from "@/components/products/CompactProductCard";
import { Heading, Text } from "@/components/ui/typography";
import type { Product } from "@/types/catalog";

interface SeasonalSectionProps {
  products: Product[];
  vendorNames: Record<string, string>;
}

// The reference's wide seasonal banner: produce photographs at both ends fading into a bright
// centre that carries the copy. The seasonal listings follow as compact cards.
export function SeasonalSection({ products, vendorNames }: SeasonalSectionProps) {
  return (
    <section id="seasonal" aria-labelledby="seasonal-title" className="scroll-mt-4 py-6 sm:py-8 lg:scroll-mt-32">
      <Container>
        <div className="surface-card relative isolate overflow-hidden rounded-3xl">
          <div aria-hidden="true" className="absolute inset-y-0 left-0 -z-10 hidden w-[36%] [mask-image:linear-gradient(to_left,transparent,#000_45%)] sm:block">
            <Image src="/images/products/fruit-basket.jpg" alt="" fill sizes="36vw" className="object-cover object-[50%_60%]" />
          </div>
          <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 hidden w-[36%] [mask-image:linear-gradient(to_right,transparent,#000_45%)] sm:block">
            <Image src="/images/products/mangoes.jpg" alt="" fill sizes="36vw" className="object-cover" />
          </div>
          <LeafMark className="absolute top-6 left-[28.5%] hidden h-10 w-8 -rotate-[24deg] lg:block" />
          <div className="max-w-xl px-5 py-5 sm:ml-[32%] sm:px-8 sm:py-7">
            <Heading id="seasonal-title" variant="h2">
              Seasonal picks
            </Heading>
            <p className="font-heading text-lg leading-tight font-medium text-primary sm:text-xl">Marked seasonal by our sellers</p>
            <Text variant="muted" className="mt-2 max-w-md">
              In a live store, availability would depend on your area and the time of year.
            </Text>
          </div>
        </div>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <CompactProductCard product={product} vendorName={vendorNames[product.vendor_id] ?? "Independent seller"} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
