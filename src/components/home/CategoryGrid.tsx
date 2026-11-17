import { CategoryCard } from "@/components/home/CategoryCard";
import { ScrollArrows } from "@/components/home/ScrollArrows";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Container } from "@/components/layout/Container";
import { shopLinks } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/catalog";

interface CategoryGridProps {
  categories: Category[];
  productCounts: Record<string, number>;
}

// Each half of the loop holds at least this many cards, so a half is always wider than the row (eight
// cards at their widest, 192px + 16px gap, are 1664px; the row is at most about 1380px). Fewer categories
// are repeated inside the half until it is that wide; otherwise the loop would show a gap on wide screens.
const MIN_CARDS_PER_HALF = 8;
const CARD_WIDTH = "w-[9.75rem] shrink-0 min-[480px]:w-[10.5rem] sm:w-[10.75rem] lg:w-[11.25rem] xl:w-[12rem]";
const CARD_SIZES = "(min-width: 1280px) 192px, (min-width: 640px) 180px, 168px";

// The store's categories in their configured order, each opening the marketplace filtered to it
// (/products?category=<slug>), gliding gently and continuously from left to right in a seamless 60s loop
// (CSS only, animate-marquee-right in globals.css).
//
// The track holds two identical halves and slides from -50% back to 0, so when it starts over the first
// half sits exactly where the second one began: no jump and no gap. Each half ends with its own gap-sized
// padding (not a flex gap between the halves) to keep them identical. Only the first appearance of each
// category is announced and reachable with the keyboard; the copies are aria-hidden and out of the tab
// order but stay ordinary links, so clicking any card, copy or not, opens its category. (An earlier
// marquee made its copies `inert`, which also made them ignore clicks.)
//
// The row pauses while hovered, while a card has keyboard focus and while pressed on touch screens. With
// reduced motion nothing moves: the copies are hidden and the row is a swipeable, snapping row paged by
// arrow buttons from md.
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
  const repeats = unique.length > 0 ? Math.ceil(MIN_CARDS_PER_HALF / unique.length) : 0;
  // One half of the loop: the categories `repeats` times; only the very first round is the real list.
  const half = Array.from({ length: repeats }, (_, round) => unique.map((tile) => ({ ...tile, copy: round > 0 }))).flat();

  const cards = (copyHalf: boolean) =>
    half.map((tile, index) => {
      const copy = copyHalf || tile.copy;
      return (
        <li
          key={`${index}-${tile.href}`}
          {...(copy && { "aria-hidden": true })}
          className={cn(CARD_WIDTH, "motion-reduce:snap-start", copy && "motion-reduce:hidden")}
        >
          <CategoryCard {...tile} copy={copy} sizes={CARD_SIZES} />
        </li>
      );
    });

  return (
    <section id="categories" aria-labelledby="categories-title" className="scroll-mt-4 pt-6 pb-3 sm:pt-8 sm:pb-4 lg:scroll-mt-32">
      <Container>
        <SectionHeading
          id="categories-title"
          title="Shop by category"
          description="From the field and the pantry to skincare, crafts and the wardrobe."
          action={{ href: "/products", label: "Browse all products" }}
          controls={
            // Arrows only where the row is scrolled by hand (reduced motion).
            <div className="hidden motion-reduce:block">
              <ScrollArrows targetId="categories-row" label="categories" />
            </div>
          }
        />
        <div
          id="categories-row"
          className="group/marquee -mx-4 overflow-hidden pt-1 pb-3 sm:-mx-1 motion-safe:sm:[mask-image:linear-gradient(90deg,transparent,black_2rem,black_calc(100%-2rem),transparent)] motion-reduce:snap-x motion-reduce:snap-mandatory motion-reduce:scroll-px-4 motion-reduce:overflow-x-auto motion-reduce:px-4 motion-reduce:scrollbar-none sm:motion-reduce:scroll-px-1 sm:motion-reduce:px-1"
        >
          <div className="flex w-max animate-marquee-right [--marquee-duration:60s] group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused] group-active/marquee:[animation-play-state:paused] motion-reduce:animate-none">
            <ul aria-label="Categories" className="flex shrink-0 gap-3 pr-3 md:gap-4 md:pr-4">
              {cards(false)}
            </ul>
            <ul aria-hidden="true" className="flex shrink-0 gap-3 pr-3 motion-reduce:hidden md:gap-4 md:pr-4">
              {cards(true)}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
