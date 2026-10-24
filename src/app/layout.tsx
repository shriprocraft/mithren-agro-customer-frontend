import type { Metadata } from "next";
import { Caveat, Poppins } from "next/font/google";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { PageBackdrop } from "@/components/layout/PageBackdrop";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { siteConfig } from "@/config/site";
import { AppProviders } from "@/context/AppProviders";
import { getBundles, getCategories, getDeliveryAreas, getProducts } from "@/services/catalog";
import "./globals.css";

// Font families are defined in src/config/design-tokens.ts and mapped to Tailwind in globals.css.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Only the hero's handwritten note uses it.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [categories, products, bundles, deliveryAreas] = await Promise.all([
    getCategories(),
    getProducts(),
    getBundles(),
    getDeliveryAreas(),
  ]);

  return (
    <html
      lang={siteConfig.locale}
      className={`${poppins.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="relative isolate flex min-h-full flex-col">
        <PageBackdrop />
        <a
          href="#main-content"
          className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <AppProviders>
          <AnnouncementBar />
          <SiteHeader categories={categories} catalog={[...products, ...bundles]} deliveryAreas={deliveryAreas} />
          {children}
          <SiteFooter categories={categories} />
        </AppProviders>
      </body>
    </html>
  );
}
