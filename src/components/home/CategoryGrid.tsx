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

// Same order as the header navigation (lib/navigation.ts), including the seasonal and combo-box
// homepage sections. Swipeable row below lg (with arrows); seven tiles in one row from lg.
export function CategoryGrid({ categories, productCounts }: CategoryGridProps) {
  const tiles = shopLinks(categories).map((link) => {
    const count = link.category ? (productCounts[link.category.id] ?? 0) : undefined;
    return {
      href: link.href,
      name: link.name,
      image: link.image,
      detail: count === undefined ? undefined : `${count} ${count === 1 ? "item" : "items"}`,
    };
  });

  return (
    <section id="categories" aria-labelledby="categories-title" className="scroll-mt-4 pt-10 pb-4 lg:scroll-mt-32 lg:pt-12">
      <Container>
        <SectionHeading
          id="categories-title"
          title="Shop by category"
          description="From the orchard and the field to the pantry and the wardrobe."
          action={{ href: "#shop", label: "Browse all products" }}
          controls={<ScrollArrows targetId="category-row" label="categories" />}
        />
        <ul
          id="category-row"
          className="relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:grid lg:grid-cols-7 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
        >
          {tiles.map((tile) => (
            <li key={tile.href} className="w-[38%] shrink-0 snap-start sm:w-[24%] md:w-[19%] lg:w-auto">
              <CategoryCard {...tile} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
