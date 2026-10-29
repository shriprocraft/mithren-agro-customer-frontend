import { ComboCard } from "@/components/home/ComboCard";
import { Container } from "@/components/layout/Container";
import { LeafMark } from "@/components/layout/LeafMark";
import { Heading, Text } from "@/components/ui/typography";
import type { Product } from "@/types/catalog";

interface ComboOffersSectionProps {
  /** The ₹1,000 / ₹5,000 / ₹10,000 budget boxes. */
  boxes: Product[];
  vendorNames: Record<string, string>;
}

// The homepage's one combo section (it replaces the earlier "Seasonal picks" and the separate "Combo
// boxes" section): a soft green panel with the three budget boxes as large price-led cards. The smaller
// packs are not repeated here; they stay in the catalogue (/products and their own pages). Every price
// is the sum of the listed items at catalogue prices (lib/bundles.ts); no discount or saving is
// invented. Each Add to cart puts the real combo product in the cart. One column on phones, three from md.
export function ComboOffersSection({ boxes, vendorNames }: ComboOffersSectionProps) {
  return (
    <section id="combo-offers" aria-labelledby="combo-offers-title" className="scroll-mt-4 py-6 sm:py-10 lg:scroll-mt-32">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-border bg-soft px-4 py-7 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <LeafMark className="absolute top-6 right-6 hidden h-12 w-9 rotate-[22deg] opacity-80 sm:block" />
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-brand uppercase">Fresh produce boxes</p>
            <Heading id="combo-offers-title" variant="h2" className="mt-1 text-2xl tracking-[0.08em] uppercase sm:text-3xl lg:text-4xl">
              Combo Offers
            </Heading>
            <Text variant="muted" className="mx-auto mt-2 max-w-xl">
              Vegetables, leafy greens and fruit in three budget sizes. Every item and quantity is listed, and each price is the total of those items at
              today’s prices.
            </Text>
          </div>
          <ul className="mt-7 grid gap-4 sm:mt-9 md:grid-cols-3 lg:gap-6">
            {boxes.map((box) => (
              <li key={box.id}>
                <ComboCard bundle={box} layout="box" vendorName={vendorNames[box.vendor_id] ?? "Independent seller"} />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
