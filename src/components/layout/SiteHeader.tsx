import { AccountMenu } from "@/components/layout/AccountMenu";
import { BrandMark } from "@/components/layout/BrandMark";
import { CartMenu } from "@/components/layout/CartMenu";
import { Container } from "@/components/layout/Container";
import { DeliveryLocationSelector } from "@/components/layout/DeliveryLocationSelector";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { WishlistMenu } from "@/components/layout/WishlistMenu";
import type { Product } from "@/types/catalog";

interface SiteHeaderProps {
  catalog: Product[];
}

// The logo on the left, on its own (no chip or capsule behind it), centred against the two rows of
// controls on the right, laid out as one grid column: wishlist, cart and account on top (three separate
// 44px glass chips in a flex row, no divider), "Delivery by area" below. The delivery control stretches
// to the column width, so both rows share the same right (and left) edge. Other pages put
// the store search between the two (below them on phones). Category browsing lives in the homepage
// "Shop by category" row, the marketplace filters and the footer.
//
// On the homepage (CSS :has(#home-hero), so no client JS and no layout shift) the header is laid over
// the hero photograph: it loses its own background, and the header search hides because the page has
// its own above "Shop by category" (#home-search). Its height there is fixed, h-28 on phones and h-30
// from lg, and the hero pulls itself up by exactly that much, so the photograph starts directly under
// the announcement bar. (It stays in the flow rather than going absolute: body is a flex column, where
// an absolute header would jump to the very top of the page.) Keep HeroSection's -mt and padding in
// step. Everywhere else it is the usual frosted bar, sticky from lg.
export function SiteHeader({ catalog }: SiteHeaderProps) {
  return (
    <header className="glass-header z-40 lg:sticky lg:top-0 [body:has(#home-hero)_&]:relative [body:has(#home-hero)_&]:h-28 [body:has(#home-hero)_&]:bg-transparent [body:has(#home-hero)_&]:bg-none [body:has(#home-hero)_&]:shadow-none [body:has(#home-hero)_&]:backdrop-blur-none [body:has(#home-hero)_&]:backdrop-saturate-100 lg:[body:has(#home-hero)_&]:h-30">
      <Container className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 py-2 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-10 lg:py-3 xl:px-10">
        <BrandMark className="h-9 justify-self-start min-[375px]:h-11 sm:h-12 lg:h-14 xl:h-16" />
        <div className="grid min-w-0 justify-self-end gap-2 lg:col-start-3 lg:row-start-1">
          <div className="flex h-11 items-center justify-end gap-1.5 min-[375px]:gap-2">
            <div className="glass-chip flex size-11 items-center justify-center rounded-full">
              <WishlistMenu catalog={catalog} />
            </div>
            <div className="glass-chip flex size-11 items-center justify-center rounded-full">
              <CartMenu catalog={catalog} />
            </div>
            <div className="glass-chip flex h-11 items-center rounded-full">
              <AccountMenu />
            </div>
          </div>
          <DeliveryLocationSelector className="w-full" />
        </div>
        <HeaderSearch className="col-span-2 w-full lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:max-w-[36rem] lg:justify-self-center xl:h-12 [body:has(#home-search)_&]:hidden" />
      </Container>
    </header>
  );
}
