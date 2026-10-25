import { BundleCard } from "@/components/home/BundleCard";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Container } from "@/components/layout/Container";
import type { Product } from "@/types/catalog";

interface BundleSectionProps {
  bundles: Product[];
  vendorNames: Record<string, string>;
}

// Three wide cards from md; below md they become a swipeable row (most of one card plus a peek of the
// next), so the boxes don't stack into a very long column on phones.
export function BundleSection({ bundles, vendorNames }: BundleSectionProps) {
  return (
    <section id="bundles" aria-labelledby="bundles-title" className="scroll-mt-4 py-6 sm:py-8 lg:scroll-mt-32">
      <Container>
        <SectionHeading
          id="bundles-title"
          title="Combo boxes"
          description="Illustrative fruit and vegetable combinations. Contents, weights and prices are sample data."
        />
        <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 md:scroll-px-0 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
          {bundles.map((bundle) => (
            <li key={bundle.id} className="w-[85%] shrink-0 snap-start sm:w-[60%] md:w-auto">
              <BundleCard bundle={bundle} vendorName={vendorNames[bundle.vendor_id] ?? "Independent seller"} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
