import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { shopAnchor } from "@/lib/browse";
import type { Product } from "@/types/catalog";

interface WomensApparelSectionProps {
  products: Product[];
  vendorNames: Record<string, string>;
}

// Editorial treatment: large portrait photography and portrait product cards. No fabric,
// quality or sourcing claims are made.
export function WomensApparelSection({ products, vendorNames }: WomensApparelSectionProps) {
  return (
    <section id="womens-apparel" aria-labelledby="apparel-title" className="scroll-mt-4 py-8 lg:scroll-mt-32">
      <Container>
        <div className="surface-card grid overflow-hidden rounded-3xl p-2 md:grid-cols-[1fr_1.15fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] md:aspect-auto md:min-h-[24rem]">
            <Image
              src="/images/home/apparel-editorial.jpg"
              alt="Woman in a red printed co-ord set holding a straw bag beside tropical plants"
              fill
              sizes="(min-width: 768px) 560px, 100vw"
              className="object-cover object-top"
            />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
            <p className="text-xs font-semibold tracking-wide text-brand uppercase">Women’s Apparel</p>
            <Heading id="apparel-title" variant="h2" className="mt-1.5 lg:text-3xl">
              Everyday ethnic wear and easy dresses
            </Heading>
            <Text variant="muted" className="mt-2 max-w-md">
              Kurta sets, co-ords and dresses from independent clothing studios, ready to add alongside the rest of your
              order.
            </Text>
            <Button asChild className="mt-6 self-start">
              <a href={shopAnchor("womens-apparel")}>
                Explore apparel
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                vendorName={vendorNames[product.vendor_id] ?? "Independent seller"}
                imageShape="portrait"
                sizes="(min-width: 1024px) 300px, 50vw"
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
