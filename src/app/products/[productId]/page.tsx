import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { CatalogImage } from "@/components/products/CatalogImage";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductDetailSkeleton } from "@/components/products/ProductDetailSkeleton";
import { PurchasePanel } from "@/components/products/PurchasePanel";
import { WishlistButton } from "@/components/products/WishlistButton";
import { Heading } from "@/components/ui/typography";
import { shopHref } from "@/lib/browse";
import { cn } from "@/lib/utils";
import { hasVariants } from "@/lib/variants";
import { getCatalog, getCategories, getProduct, getRelatedProducts, getVendors } from "@/services/catalog";

// Every catalogue item is prerendered. Other ids render at request time (Cache Components has no
// dynamicParams), so params are awaited inside Suspense for an instant shell, and unknown ids call
// notFound(), which renders not-found.tsx beside this file. The fallback must stay at least a screen
// tall (see ProductDetailSkeleton) or client navigations can land at the bottom of the page.
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
      <Container className="pt-4 pb-10 sm:pt-6 lg:pt-8">
        <Suspense fallback={<ProductDetailSkeleton />}>
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

  // Mobile reads top to bottom in buying order: image, name, price and pack, availability, seller,
  // quantity and the two purchase buttons, then the longer details. The image is 4:3 on phones so the
  // purchase controls start on the first screen; from md it sits beside the details and stays in view.
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

      <div className="mt-3 grid gap-5 sm:mt-5 md:grid-cols-2 md:gap-8 lg:gap-12">
        <div className="md:sticky md:top-4 md:self-start lg:top-32">
          <div
            className={cn(
              "surface-card relative overflow-hidden rounded-3xl",
              portrait ? "aspect-[4/3] md:aspect-[4/5]" : "aspect-[4/3] md:aspect-square",
              image?.studio ? "bg-white" : "bg-muted",
            )}
          >
            {image && <CatalogImage image={image} sizes="(min-width: 1024px) 600px, 100vw" />}
            {product.is_seasonal && (
              <span className="absolute top-3 left-3 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-brand">Seasonal</span>
            )}
            <WishlistButton productId={product.id} productName={product.name} className="absolute top-1.5 right-1.5" />
          </div>
        </div>

        <div className="min-w-0">
          {category && (
            <Link href={shopHref(category.slug)} className="inline-flex min-h-9 items-center text-xs font-semibold tracking-wide text-brand uppercase underline-offset-4 hover:underline">
              {category.name}
            </Link>
          )}
          <Heading as="h1" variant="h1" className="text-[1.625rem] sm:text-3xl lg:text-4xl">{product.name}</Heading>

          {/* Price, availability and seller follow the chosen option, so they live in the panel. */}
          <PurchasePanel product={product} seller={seller} />

          <section aria-labelledby="details-title" className="mt-8">
            <h2 id="details-title" className="font-heading text-base font-semibold">Product details</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{product.description}</p>
            {product.bundle_contents && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold">Box contents</h3>
                <ul aria-label="Box contents" className="mt-2 flex flex-wrap gap-1.5">
                  {product.bundle_contents.map((item) => (
                    <li key={item} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <dl className="mt-4 divide-y divide-border rounded-2xl border border-border text-sm">
              {[
                hasVariants(product) && product.variants.length > 1
                  ? [product.variant_type === "size" ? "Sizes" : "Options", product.variants.map((v) => v.label).join(", ")]
                  : ["Pack size", product.unit],
                ...(product.variant_type === "size" ? [["Set", product.unit]] : []),
                ...(category ? [["Category", category.name]] : []),
                ...(seller ? [["Seller", seller]] : []),
              ].map(([term, value]) => (
                <div key={term} className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">{term}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex gap-2 rounded-2xl bg-secondary p-3 text-xs leading-relaxed text-secondary-foreground">
              <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
              Sample listing for this preview. Delivery estimates, reviews and payment are not available yet.
            </p>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-12 border-t border-border pt-8 sm:mt-14">
          <Heading id="related-title" variant="h2">More from {category?.name ?? "this category"}</Heading>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
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
