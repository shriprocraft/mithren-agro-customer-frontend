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

// The store's categories in their configured order, each shown once and each opening the marketplace
// filtered to it (/products?category=<slug>). One swipeable, snapping row, paged by arrow buttons from
// md; cards keep a fixed, readable width at every size. (It used to scroll on its own as a marquee
// holding the list twice, with an inert copy: with only a few categories both copies showed at once,
// so categories appeared twice and the copies didn't respond to clicks.)
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

  // One tile per category, even if the catalogue were to list one twice.
  const unique = tiles.filter((tile, index) => tiles.findIndex((other) => other.href === tile.href) === index);

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
          {unique.map((tile) => (
            <li key={tile.href} className="w-[9.75rem] shrink-0 snap-start min-[480px]:w-[10.5rem] sm:w-[10.75rem] lg:w-[11.25rem] xl:w-[12rem]">
              <CategoryCard {...tile} sizes="(min-width: 1280px) 192px, (min-width: 640px) 180px, 168px" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
