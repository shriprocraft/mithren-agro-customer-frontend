import { AboutSection } from "@/components/home/AboutSection";
import { BundleSection } from "@/components/home/BundleSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { HeroSection } from "@/components/home/HeroSection";
import { MarketplaceBanner } from "@/components/home/MarketplaceBanner";
import { SeasonalSection } from "@/components/home/SeasonalSection";
import { VideoSection } from "@/components/home/VideoSection";
import { getBundles, getCategories, getProducts, getSeasonalProducts, getVendors } from "@/services/catalog";

// A focused homepage: the two-slide hero, About Mithren Agro, the two video cards, Shop by category,
// Seasonal picks, Combo boxes and the closing "browse" banner. The per-category rows (fresh picks,
// groceries, farm essentials, apparel) and the twin promo banners were removed from this page only;
// every product is still reachable from the category tiles, the header and /products, and those
// section components remain in components/home for reuse.
export default async function Home() {
  const [categories, vendors, products, seasonal, bundles] = await Promise.all([
    getCategories(),
    getVendors(),
    getProducts(),
    getSeasonalProducts(),
    getBundles(),
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
      <CategoryGrid categories={categories} productCounts={productCounts} />
      <SeasonalSection products={seasonal} vendorNames={vendorNames} />
      <BundleSection bundles={bundles} vendorNames={vendorNames} />
      <MarketplaceBanner />
    </main>
  );
}
