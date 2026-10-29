import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { PageBackdrop } from "@/components/layout/PageBackdrop";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { siteConfig } from "@/config/site";
import { AppProviders } from "@/context/AppProviders";
import { getBundles, getCategories, getProducts } from "@/services/catalog";
import "./globals.css";

// Font families are defined in src/config/design-tokens.ts and mapped to Tailwind in globals.css.
// Body, headings and interface text. Variable font, so one file covers every weight.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

// Only the homepage hero heading uses it (Heading variant="display").
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
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
  const [categories, products, bundles] = await Promise.all([
    getCategories(),
    getProducts(),
    getBundles(),
  ]);

  return (
    <html
      lang={siteConfig.locale}
      className={`${montserrat.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="relative isolate flex min-h-full flex-col">
        <PageBackdrop />
        <a
          href="#main-content"
          className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {/* Reads the URL, so it renders on the client inside its own boundary. */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <AppProviders>
          <AnnouncementBar />
          <SiteHeader catalog={[...products, ...bundles]} />
          {children}
          <SiteFooter categories={categories} />
        </AppProviders>
      </body>
    </html>
  );
}
