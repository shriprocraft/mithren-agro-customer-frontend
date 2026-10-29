import { CategoryCard } from "@/components/home/CategoryCard";
import { MarqueeControls } from "@/components/home/MarqueeControls";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Container } from "@/components/layout/Container";
import { shopLinks } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/catalog";

interface CategoryGridProps {
  categories: Category[];
  productCounts: Record<string, number>;
}

// The nine categories in their configured order (data/categories.ts), each opening the marketplace
// filtered to it, in a row that moves on its own from right to left, continuously (CSS only, no JS
// loop). The track holds the list twice; the copy is inert and aria-hidden, so keyboards and screen
// readers meet each category once. Animating the track by -50% (globals.css, animate-marquee) brings
// the copy exactly to where the original started, so the loop never jumps or leaves a gap: each list
// ends with its own gap-sized padding, and is always wider than the row, so the copy fills the space.
// The row pauses while hovered, while a card has keyboard focus, while pressed on touch screens and
// while the Pause button (next to "Browse all products", at every width) is on; an explicit pause
// holds through hover and focus. Durations follow the copy's width at each breakpoint (nine cards
// plus gaps), so the speed stays about 32px/s everywhere. Cards keep a fixed, readable
// width at every size; on phones the row runs edge to edge, from sm it fades out at both ends.
// The viewport clips the moving track, so the page never scrolls sideways.
//
// With reduced motion nothing moves: the copy is hidden and the row becomes the earlier swipeable,
// snapping row, paged by arrow buttons from md.
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

  const list = (copy: boolean) => (
    <ul
      {...(copy ? { "aria-hidden": true, inert: true } : { "aria-label": "Categories" })}
      className={cn("flex shrink-0 gap-3 pr-3 md:gap-4 md:pr-4", copy && "motion-reduce:hidden")}
    >
      {tiles.map((tile) => (
        <li key={tile.href} className="w-[9.75rem] shrink-0 min-[480px]:w-[10.5rem] sm:w-[10.75rem] motion-reduce:snap-start lg:w-[11.25rem] xl:w-[12rem]">
          <CategoryCard {...tile} sizes="(min-width: 1280px) 192px, (min-width: 640px) 180px, 168px" />
        </li>
      ))}
    </ul>
  );

  return (
    <section id="categories" aria-labelledby="categories-title" className="scroll-mt-4 pt-6 pb-3 sm:pt-8 sm:pb-4 lg:scroll-mt-32">
      <Container>
        <SectionHeading
          id="categories-title"
          title="Shop by category"
          description="From the field and the pantry to skincare, crafts and the wardrobe."
          action={{ href: "/products", label: "Browse all products" }}
          controls={<MarqueeControls targetId="categories-row" label="categories" itemLabel="category" />}
          controlsOnMobile
        />
        <div
          id="categories-row"
          className="group/marquee -mx-4 overflow-hidden pt-1 pb-3 sm:mx-0 motion-safe:sm:[mask-image:linear-gradient(90deg,transparent,black_2rem,black_calc(100%-2rem),transparent)] motion-reduce:snap-x motion-reduce:snap-mandatory motion-reduce:scroll-px-4 motion-reduce:overflow-x-auto motion-reduce:px-4 motion-reduce:scrollbar-none sm:motion-reduce:-mx-1 sm:motion-reduce:scroll-px-1 sm:motion-reduce:px-1"
        >
          <div className="flex w-max animate-marquee [--marquee-duration:47s] min-[480px]:[--marquee-duration:50s] sm:[--marquee-duration:52s] md:[--marquee-duration:53s] lg:[--marquee-duration:55s] xl:[--marquee-duration:58s] group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused] group-active/marquee:[animation-play-state:paused] group-data-paused/marquee:[animation-play-state:paused] motion-reduce:animate-none">
            {list(false)}
            {list(true)}
          </div>
        </div>
      </Container>
    </section>
  );
}
