import { CategoryCard } from "@/components/home/CategoryCard";
import { ScrollArrows } from "@/components/home/ScrollArrows";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Container } from "@/components/layout/Container";
import { shopLinks } from "@/lib/navigation";
import type { Category } from "@/types/catalog";

interface CategoryGridProps {
  categories: Category[];
  productCounts: Record<string, number>;
}

// The nine categories in their configured order (data/categories.ts), each opening the marketplace
// filtered to it. The cards keep a comfortable size instead of shrinking to fit nine across: one
// row that swipes on touch screens (snapping card by card) and pages with the arrow buttons from md.
// The row scrolls inside itself, so the page never scrolls sideways; on phones the next card peeks in
// at the edge to show there is more. The 4px inner gutter keeps focus rings from being clipped.
export function CategoryGrid({ categories, productCounts }: CategoryGridProps) {
  const tiles = shopLinks(categories).map((link) => {
    const count = productCounts[link.category.id] ?? 0;
    return {
      href: link.href,
      name: link.name,
      image: link.image,
      detail: `${count} ${count === 1 ? "item" : "items"}`,
    };
  });

  return (
    <section id="categories" aria-labelledby="categories-title" className="scroll-mt-4 pt-6 pb-3 sm:pt-8 sm:pb-4 lg:scroll-mt-32">
      <Container>
        <SectionHeading
          id="categories-title"
          title="Shop by category"
          description="From the field and the pantry to skincare, crafts and the wardrobe."
          action={{ href: "/products", label: "Browse all products" }}
          controls={<ScrollArrows targetId="categories-row" label="categories" />}
        />
        <ul
          id="categories-row"
          aria-label="Categories"
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-1 pb-3 scrollbar-none sm:-mx-1 sm:scroll-px-1 sm:px-1 md:gap-4"
        >
          {tiles.map((tile) => (
            <li key={tile.href} className="w-[40%] shrink-0 snap-start min-[480px]:w-[29%] sm:w-[calc((100%-3*0.75rem)/4)] md:w-[calc((100%-3*1rem)/4)] lg:w-[calc((100%-4*1rem)/5)] xl:w-[calc((100%-5*1rem)/6)]">
              <CategoryCard {...tile} sizes="(min-width: 1024px) 210px, (min-width: 640px) 25vw, 40vw" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
