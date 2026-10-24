import { BrandMark } from "@/components/layout/BrandMark";
import { Container } from "@/components/layout/Container";
import { siteConfig } from "@/config/site";
import { shopAnchor } from "@/lib/browse";
import type { Category } from "@/types/catalog";

// Pages that do not exist yet are listed as plain text, not links (scope §8: no dead links).
const plannedColumns = [
  { title: "Customer support", items: ["Help centre", "Delivery information", "Returns & refunds", "FAQs"] },
  { title: "Policies", items: ["Privacy policy", "Terms & conditions", "Cancellation & refund policy", "Shipping policy"] },
];

function ColumnTitle({ children, id }: { children: string; id?: string }) {
  return (
    <h2 id={id} className="font-heading text-[0.8125rem] font-semibold text-foreground">
      {children}
    </h2>
  );
}

export function SiteFooter({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-12 border-t bg-card">
      <Container className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="col-span-2 space-y-4 lg:col-span-1">
          <BrandMark className="h-14" />
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            A marketplace for fresh produce, pantry staples, farm supplies and women’s apparel from independent sellers.
          </p>
          <p className="text-xs text-muted-foreground">Social channels and contact details will be published here.</p>
        </div>
        <nav aria-labelledby="footer-shop" className="space-y-3">
          <ColumnTitle id="footer-shop">Shop</ColumnTitle>
          <ul className="space-y-0.5 text-[0.8125rem]">
            {categories.map((category) => (
              <li key={category.id}>
                <a href={shopAnchor(category.slug)} className="inline-flex min-h-9 items-center font-medium text-foreground underline-offset-4 hover:text-brand hover:underline">
                  {category.name}
                </a>
              </li>
            ))}
            <li>
              <a href="#bundles" className="inline-flex min-h-9 items-center font-medium text-foreground underline-offset-4 hover:text-brand hover:underline">
                Combo boxes
              </a>
            </li>
          </ul>
        </nav>
        {plannedColumns.map((column) => (
          <div key={column.title} className="space-y-3">
            <ColumnTitle>{column.title}</ColumnTitle>
            <ul className="space-y-0.5 text-[0.8125rem] text-muted-foreground">
              {column.items.map((item) => (
                <li key={item} className="flex min-h-9 items-center">{item}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">Pages coming soon</p>
          </div>
        ))}
        <div className="col-span-2 space-y-3 sm:col-span-1">
          <ColumnTitle>Sell with us</ColumnTitle>
          <p className="text-[0.8125rem] text-muted-foreground">
            Seller registration for farmers, stores and brands will open here.
          </p>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </div>
      </Container>
      <div className="bg-band">
        <Container className="flex flex-col gap-1 py-3 text-xs text-secondary-foreground sm:flex-row sm:justify-between">
          <p>© {siteConfig.legalName}</p>
          <p>Preview storefront · listings, prices and sellers are sample data</p>
        </Container>
      </div>
    </footer>
  );
}
