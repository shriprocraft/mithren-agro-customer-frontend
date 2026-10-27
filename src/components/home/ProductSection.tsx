import { ScrollArrows } from "@/components/home/ScrollArrows";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types/catalog";

interface ProductSectionProps {
  id: string;
  title: string;
  description: string;
  products: Product[];
  vendorNames: Record<string, string>;
  action?: { href: string; label: string };
}

// The reference's single row of compact cards with round arrows: swipeable everywhere, eight
// visible from xl, fewer on smaller screens.
export function ProductSection({ id, title, description, products, vendorNames, action }: ProductSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-4 py-6 sm:py-8 lg:scroll-mt-32">
      <Container>
        <SectionHeading
          id={`${id}-title`}
          title={title}
          description={description}
          action={action}
          controls={<ScrollArrows targetId={`${id}-row`} label="products" />}
        />
        <ul
          id={`${id}-row`}
          className="relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 py-1 sm:scroll-px-0 scrollbar-none sm:mx-0 sm:px-0"
        >
          {products.map((product) => (
            <li
              key={product.id}
              className="w-[46%] shrink-0 snap-start min-[480px]:w-[31%] sm:w-[calc((100%-2*0.75rem)/3)] md:w-[calc((100%-3*0.75rem)/4)] lg:w-[calc((100%-5*0.75rem)/6)] xl:w-[calc((100%-7*0.75rem)/8)]"
            >
              <ProductCard
                product={product}
                vendorName={vendorNames[product.vendor_id] ?? "Independent seller"}
                sizes="(min-width: 1280px) 160px, (min-width: 1024px) 16vw, (min-width: 640px) 25vw, 46vw"
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
