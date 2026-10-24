import { BundleSection } from "@/components/home/BundleSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FarmEssentialsSection } from "@/components/home/FarmEssentialsSection";
import { HeroSection } from "@/components/home/HeroSection";
import { MarketplaceBanner } from "@/components/home/MarketplaceBanner";
import { OrganicGroceriesSection } from "@/components/home/OrganicGroceriesSection";
import { ProductSection } from "@/components/home/ProductSection";
import { PromoBanners } from "@/components/home/PromoBanners";
import { SeasonalSection } from "@/components/home/SeasonalSection";
import { ShopBrowser } from "@/components/home/ShopBrowser";
import { WomensApparelSection } from "@/components/home/WomensApparelSection";
import {
  getBundles,
  getCategories,
  getProducts,
  getProductsByCategory,
  getSeasonalProducts,
  getVendors,
} from "@/services/catalog";
import { roundRobin } from "@/lib/collections";

export default async function Home() {
  const [categories, vendors, products, seasonal, bundles, fruits, vegetables, groceries, fertilizers, apparel] =
    await Promise.all([
      getCategories(),
      getVendors(),
      getProducts(),
      getSeasonalProducts(),
      getBundles(),
      getProductsByCategory("fruits"),
      getProductsByCategory("vegetables"),
      getProductsByCategory("organic-groceries"),
      getProductsByCategory("fertilizers"),
      getProductsByCategory("womens-apparel"),
    ]);

  const vendorNames = Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor.name]));
  const productCounts = Object.fromEntries(
    categories.map((category) => [category.id, products.filter((p) => p.category_id === category.id).length]),
  );
  // Sellers who list fruit or vegetables, for the hero's "Meet Our Farmers" panel.
  const growerIds = new Set([...fruits, ...vegetables].map((p) => p.vendor_id));
  const growers = vendors.filter((vendor) => growerIds.has(vendor.id)).map((vendor) => vendor.name);

  return (
    <main id="main-content" className="flex-1">
      <HeroSection growers={growers} />
      <CategoryGrid categories={categories} productCounts={productCounts} />
      <PromoBanners />
      <ProductSection
        id="fresh-picks"
        title="Fresh picks"
        description="Fruit and vegetables from produce sellers on the marketplace. Sample listings."
        products={roundRobin([fruits, vegetables]).slice(0, 8)}
        vendorNames={vendorNames}
        action={{ href: "/products?category=fruits,vegetables", label: "All fruit & vegetables" }}
      />
      <SeasonalSection products={seasonal} vendorNames={vendorNames} />
      <ShopBrowser products={products} categories={categories} vendorNames={vendorNames} />
      <OrganicGroceriesSection products={groceries} vendorNames={vendorNames} />
      <FarmEssentialsSection products={fertilizers} vendorNames={vendorNames} />
      <WomensApparelSection products={apparel} vendorNames={vendorNames} />
      <BundleSection bundles={bundles} vendorNames={vendorNames} />
      <MarketplaceBanner />
    </main>
  );
}
