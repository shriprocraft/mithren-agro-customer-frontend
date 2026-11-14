import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { unstable_rethrow } from "next/navigation";
import { LoadingState } from "@/components/checkout/PageState";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Container } from "@/components/layout/Container";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { PageBackdrop } from "@/components/layout/PageBackdrop";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { siteConfig } from "@/config/site";
import { AppProviders } from "@/context/AppProviders";
import { CatalogCategoriesProvider } from "@/context/CatalogCategoriesContext";
import { getBundles, getCategories, getProducts } from "@/services/catalog";
import type { Category, Product } from "@/types/catalog";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
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
          {/* The catalogue is read live from the backend on every request, so it loads inside a boundary. */}
          <Suspense fallback={<StoreLoading />}>
            <CatalogFrame>{children}</CatalogFrame>
          </Suspense>
        </AppProviders>
      </body>
    </html>
  );
}

// The header's search and mini cart, the footer's category links and the client components that need a
// category all use the backend catalogue. If it can't be read, the frame says so and shows no catalogue
// (never sample data); the page itself then shows its own error state (app/error.tsx).
async function CatalogFrame({ children }: { children: ReactNode }) {
  let catalog: { categories: Category[]; items: Product[] } | null = null;
  try {
    const [categories, products, bundles] = await Promise.all([getCategories(), getProducts(), getBundles()]);
    catalog = { categories, items: [...products, ...bundles] };
  } catch (error) {
    unstable_rethrow(error); // Next.js's own rendering signals pass through; only real failures are handled here.
    console.error("[catalog] The store frame couldn't load the catalogue:", error);
  }

  return (
    <CatalogCategoriesProvider categories={catalog?.categories ?? []}>
      <AnnouncementBar />
      <SiteHeader catalog={catalog?.items ?? []} />
      {!catalog && (
        <Container>
          <p role="alert" className="mt-3 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-card p-3 text-sm text-destructive">
            <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
            The store’s catalogue couldn’t be loaded, so products, categories and search aren’t available right now.
          </p>
        </Container>
      )}
      {children}
      <SiteFooter categories={catalog?.categories ?? []} />
    </CatalogCategoriesProvider>
  );
}

function StoreLoading() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader catalog={[]} />
      <main id="main-content" className="flex-1">
        <Container className="pt-4 pb-10 sm:pt-6">
          <LoadingState label="Loading the store…" fullHeight />
        </Container>
      </main>
    </>
  );
}
