import { BundleCard } from "@/components/home/BundleCard";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Container } from "@/components/layout/Container";
import type { Product } from "@/types/catalog";

interface BundleSectionProps {
  bundles: Product[];
  vendorNames: Record<string, string>;
}

export function BundleSection({ bundles, vendorNames }: BundleSectionProps) {
  return (
    <section id="bundles" aria-labelledby="bundles-title" className="scroll-mt-4 py-8 lg:scroll-mt-32">
      <Container>
        <SectionHeading
          id="bundles-title"
          title="Combo boxes"
          description="Illustrative fruit and vegetable combinations. Contents, weights and prices are sample data."
        />
        <ul className="grid gap-3 md:grid-cols-3">
          {bundles.map((bundle) => (
            <li key={bundle.id}>
              <BundleCard bundle={bundle} vendorName={vendorNames[bundle.vendor_id] ?? "Independent seller"} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
