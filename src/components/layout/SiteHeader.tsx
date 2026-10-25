import { AccountMenu } from "@/components/layout/AccountMenu";
import { BrandMark } from "@/components/layout/BrandMark";
import { CartMenu } from "@/components/layout/CartMenu";
import { CategoryNavigation } from "@/components/layout/CategoryNavigation";
import { Container } from "@/components/layout/Container";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { LocationSelector } from "@/components/layout/LocationSelector";
import { WishlistMenu } from "@/components/layout/WishlistMenu";
import type { Category, DeliveryArea, Product } from "@/types/catalog";

interface SiteHeaderProps {
  categories: Category[];
  catalog: Product[];
  deliveryAreas: DeliveryArea[];
}

// Mobile: one compact row (logo, location, saved items, account), then full-width search and the
// swipeable category row, so shopping starts high on the first screen. Desktop: one row, sticky.
// Controls share one 44px height. Wishlist and cart sit together in a single glass capsule, so the
// right side reads as three groups (location · saved items · account), as in the reference.
// From lg the header has a fixed height so the hero can slide its photograph underneath the glass:
// h-23 (56px row + 36px nav) at lg, and from xl the target's proportions, h-29 (76px row with a 64px
// logo + 40px nav). Keep HeroSection's -mt/pt values in step with it.
export function SiteHeader({ categories, catalog, deliveryAreas }: SiteHeaderProps) {
  return (
    <header className="glass-header z-40 lg:sticky lg:top-0 lg:h-23 xl:h-29">
      <Container className="flex flex-wrap items-center gap-x-1.5 gap-y-2 pt-2 pb-1 min-[375px]:gap-x-2.5 lg:h-14 lg:flex-nowrap lg:gap-x-6 lg:py-0 lg:px-10 xl:h-19 xl:gap-x-5 xl:pr-16 xl:pl-[6.5rem]">
        <BrandMark className="order-1 h-9 sm:h-11 xl:h-16" />
        <HeaderSearch className="order-4 w-full lg:order-2 lg:ml-4 lg:max-w-[34rem] lg:flex-1 xl:ml-[4.5rem] xl:h-12 xl:max-w-[35.5rem]" />
        <LocationSelector areas={deliveryAreas} className="order-2 ml-auto lg:order-3" />
        <div className="order-3 flex items-center gap-1.5 min-[375px]:gap-2.5 lg:order-4 lg:gap-3">
          <div className="glass-chip flex items-center rounded-full">
            <WishlistMenu catalog={catalog} />
            <span aria-hidden="true" className="h-5 w-px bg-foreground/10" />
            <CartMenu catalog={catalog} />
          </div>
          <AccountMenu />
        </div>
      </Container>
      <CategoryNavigation categories={categories} />
    </header>
  );
}
