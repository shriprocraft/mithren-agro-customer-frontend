import { AboutSection } from "@/components/home/AboutSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ComboOffersSection } from "@/components/home/ComboOffersSection";
import { HeroSection } from "@/components/home/HeroSection";
import { InvestorOpportunitiesSection } from "@/components/home/InvestorOpportunitiesSection";
import { MarketplaceBanner } from "@/components/home/MarketplaceBanner";
import { VideoSection } from "@/components/home/VideoSection";
import { Container } from "@/components/layout/Container";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { getCategories, getComboBoxes, getProducts, getVendors } from "@/services/catalog";
import { getInvestmentDomains, getInvestmentPlans, getInvestmentProjects } from "@/services/investments";

// The announcement bar (layout) and then the hero, with the header laid over its photograph and the
// benefits strip along its bottom; About Mithren Agro and the two video cards; the store search,
// directly above Shop by category; Combo offers; Investor Opportunities; and the closing "browse"
// banner. The search here replaces the header search on this page only (SiteHeader hides its own
// while #home-search is present); both use the same component and URL.
export default async function Home() {
  const [categories, vendors, products, boxes, domains, projects, plans] = await Promise.all([
    getCategories(),
    getVendors(),
    getProducts(),
    getComboBoxes(),
    getInvestmentDomains(),
    getInvestmentProjects(),
    getInvestmentPlans(),
  ]);

  const vendorNames = Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor.name]));
  const productCounts = Object.fromEntries(
    categories.map((category) => [category.id, products.filter((p) => p.category_id === category.id).length]),
  );

  return (
    <main id="main-content" className="flex-1">
      <HeroSection />
      <AboutSection />
      <VideoSection />
      <section id="home-search" aria-label="Search products" className="scroll-mt-4 pt-4 sm:pt-6 lg:scroll-mt-32">
        <Container>
          <HeaderSearch size="large" className="mx-auto max-w-2xl" />
        </Container>
      </section>
      <CategoryGrid categories={categories} productCounts={productCounts} />
      <ComboOffersSection boxes={boxes} vendorNames={vendorNames} />
      <InvestorOpportunitiesSection domains={domains} projects={projects} plans={plans} />
      <MarketplaceBanner />
    </main>
  );
}
