import { ArrowRight, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { LeafMark } from "@/components/layout/LeafMark";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { shopHref } from "@/lib/browse";
import type { Product } from "@/types/catalog";

interface OrganicGroceriesSectionProps {
  products: Product[];
  vendorNames: Record<string, string>;
}

// Intro panel beside a compact pantry grid.
export function OrganicGroceriesSection({ products, vendorNames }: OrganicGroceriesSectionProps) {
  return (
    <section id="organic-groceries" aria-labelledby="groceries-title" className="scroll-mt-4 py-6 sm:py-8 lg:scroll-mt-32">
      <Container className="grid gap-4 lg:grid-cols-[minmax(0,19rem)_1fr]">
        <div className="surface-card relative rounded-3xl p-5 sm:p-6 lg:sticky lg:top-32 lg:self-start">
          <LeafMark className="absolute top-5 right-5 h-9 w-7 rotate-[20deg]" />
          <p className="text-xs font-semibold tracking-wide text-brand uppercase">Organic Groceries</p>
          <Heading id="groceries-title" variant="h2" className="mt-1.5 pr-8">
            Pantry staples, sold by the pack
          </Heading>
          <Text variant="muted" className="mt-2">
            Rice, millets, pulses, flour and other essentials from independent stores, with the pack size shown on every
            listing.
          </Text>
          <p className="mt-4 flex gap-2.5 rounded-2xl bg-secondary p-3.5 text-xs leading-relaxed text-secondary-foreground">
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
            A certified-organic label appears only after a seller’s certificate has been verified. None of these sample
            items carries one.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href={shopHref("organic-groceries")}>
              Browse all groceries
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                vendorName={vendorNames[product.vendor_id] ?? "Independent seller"}
                sizes="(min-width: 1024px) 300px, (min-width: 640px) 33vw, 50vw"
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
