"use client";

import { Container } from "@/components/layout/Container";
import { useBrowse } from "@/context/BrowseContext";
import { shopAnchor } from "@/lib/browse";
import { shopLinks } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/catalog";

// Text-only row in the reference's order (see lib/navigation.ts). Category links point at the
// homepage product browser until category pages exist (scope §8); seasonal produce and combo boxes
// jump to their homepage sections. Below lg the row scrolls sideways inside itself, with a fade
// on the right edge so the cut-off reads as "more", never as page overflow.
export function CategoryNavigation({ categories }: { categories: Category[] }) {
  const { category: active } = useBrowse();
  const links = [
    { href: shopAnchor("all"), name: "All products", slug: "all" as const },
    ...shopLinks(categories).map((link) => ({ href: link.href, name: link.name, slug: link.category?.slug })),
  ];

  return (
    <nav aria-label="Product categories">
      {/* From xl the row sits in the target's faint translucent pill, a little wider than the links. */}
      <Container className="lg:px-10 xl:px-[4.5rem]">
        <ul className="relative -mx-4 flex snap-x gap-1 overflow-x-auto pr-10 pl-4 [mask-image:linear-gradient(to_right,#000_88%,transparent)] [scrollbar-width:none] sm:mx-0 sm:px-0 lg:h-9 lg:items-center lg:justify-between lg:overflow-visible lg:[mask-image:none] xl:h-10 xl:rounded-full xl:bg-white/35 xl:px-8 xl:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.7),0_6px_18px_-14px_rgb(var(--shadow-tint)/0.35)] [&::-webkit-scrollbar]:hidden">
          {links.map(({ href, name, slug }) => {
            const isActive = slug !== undefined && slug === active;
            return (
              <li key={href} className="snap-start">
                <a
                  href={href}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative inline-flex min-h-11 items-center rounded-full px-3 text-[0.8125rem] whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring lg:px-1 xl:text-xs",
                    isActive &&
                      "font-medium text-brand after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:rounded-full after:bg-primary hover:text-brand xl:after:-inset-x-4 xl:after:bottom-0",
                  )}
                >
                  {name}
                </a>
              </li>
            );
          })}
        </ul>
      </Container>
    </nav>
  );
}
