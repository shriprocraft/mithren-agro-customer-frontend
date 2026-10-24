import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { CatalogImage } from "@/components/products/CatalogImage";
import { PriceDisplay } from "@/components/products/PriceDisplay";
import { ProductCard } from "@/components/products/ProductCard";
import { PurchasePanel } from "@/components/products/PurchasePanel";
import { StockBadge } from "@/components/products/StockBadge";
import { Heading } from "@/components/ui/typography";
import { shopHref } from "@/lib/browse";
import { cn } from "@/lib/utils";
import { getCatalog, getCategories, getProduct, getRelatedProducts, getVendors } from "@/services/catalog";

// Every catalogue item is prerendered. Other ids render at request time (Cache Components has no
// dynamicParams), so params are awaited inside Suspense for an instant shell, and unknown ids call
// notFound(), which renders not-found.tsx beside this file.
export async function generateStaticParams() {
  return (await getCatalog()).map((p) => ({ productId: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/products/[productId]">): Promise<Metadata> {
  const product = await getProduct((await params).productId);
  return { title: product ? product.name : "Product not found" };
}

export default function ProductPage({ params }: PageProps<"/products/[productId]">) {
  return (
    <main id="main-content" className="flex-1">
      <Container className="py-8">
        <Suspense fallback={<p role="status" className="py-20 text-center text-sm text-muted-foreground">Loading product…</p>}>
          <ProductContent params={params} />
        </Suspense>
      </Container>
    </main>
  );
}

async function ProductContent({ params }: Pick<PageProps<"/products/[productId]">, "params">) {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) notFound();

  const [categories, vendors, related] = await Promise.all([getCategories(), getVendors(), getRelatedProducts(product)]);
  const category = categories.find((c) => c.id === product.category_id);
  const vendorNames = Object.fromEntries(vendors.map((v) => [v.id, v.name]));
  const seller = vendorNames[product.vendor_id];
  const image = product.images[0];
  const portrait = product.category_id === "cat-womens-apparel";

  return (
    <>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/products" },
            ...(category ? [{ label: category.name, href: shopHref(category.slug) }] : []),
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className={cn("surface-card relative overflow-hidden rounded-3xl", portrait ? "aspect-[4/5]" : "aspect-square", image?.studio ? "bg-white" : "bg-muted")}>
            {image && <CatalogImage image={image} sizes="(min-width: 1024px) 600px, 100vw" />}
            {product.is_seasonal && (
              <span className="absolute top-4 left-4 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-brand">Seasonal</span>
            )}
          </div>

          <div>
            {category && <p className="text-xs font-semibold tracking-wide text-brand uppercase">{category.name}</p>}
            <Heading as="h1" variant="h1" className="mt-2">{product.name}</Heading>
            <p className="mt-2 text-sm text-muted-foreground">
              Pack size: <span className="font-medium text-foreground">{product.unit}</span>
              {seller && <> · Sold by <span className="font-medium text-foreground">{seller}</span></>}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <PriceDisplay price={product.price} discountedPrice={product.discounted_price} className="text-2xl" />
              <StockBadge status={product.stock_status} className="text-sm" />
            </div>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{product.description}</p>
            {product.bundle_contents && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold">Box contents</h2>
                <ul aria-label="Box contents" className="mt-2 flex flex-wrap gap-1.5">
                  {product.bundle_contents.map((item) => (
                    <li key={item} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6">
              <PurchasePanel product={product} />
            </div>
            <p className="mt-6 flex gap-2 rounded-2xl bg-secondary p-3 text-xs text-secondary-foreground">
              <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
              Sample listing for this preview. Delivery estimates, reviews and payment are not available yet.
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mt-14">
            <Heading id="related-title" variant="h2">More from {category?.name ?? "this category"}</Heading>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} vendorName={vendorNames[p.vendor_id] ?? "Independent seller"} imageShape={portrait ? "portrait" : "square"} />
                </li>
              ))}
            </ul>
          </section>
        )}
    </>
  );
}
