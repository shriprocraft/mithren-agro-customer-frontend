import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";
import { Container } from "@/components/layout/Container";
import { policyLinks } from "@/components/policies/policy-links";
import { siteConfig } from "@/config/site";
import { shopHref } from "@/lib/browse";
import type { Category } from "@/types/catalog";

// Every link opens a page that exists (scope §8: no dead links). Contact Us and FAQs are sections of
// the Help & support page until dedicated contact channels exist.
const supportLinks = [
  { href: "/support#contact", label: "Contact Us" },
  { href: "/support", label: "Help & Support" },
  { href: "/support#faqs", label: "FAQs" },
  { href: "/account/orders", label: "My Orders" },
  { href: "/account/track", label: "Order Tracking" },
];

const opportunityLinks = [
  { href: "/agent-benefits", label: "Agent Benefits" },
  { href: "/investors", label: "Investor Opportunities" },
];

const linkClass =
  "inline-flex min-h-9 items-center text-foreground/80 underline-offset-4 transition-colors outline-none hover:text-brand hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring";

function Column({ id, title, links }: { id: string; title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <nav aria-labelledby={id} className="min-w-0">
      <h2 id={id} className="font-heading text-sm font-semibold text-foreground">{title}</h2>
      <ul className="mt-3 space-y-0.5 text-[0.8125rem]">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Brand and About on the left, then Shop, Customer support, Policies and Grow with us. Phones: the
// brand block, then two columns; tablets three; desktops one row.
export function SiteFooter({ categories }: { categories: Category[] }) {
  const shopLinks = [
    { href: "/products", label: "All products" },
    ...categories.map((category) => ({ href: shopHref(category.slug), label: category.name })),
    { href: "/#bundles", label: "Combo boxes" },
  ];

  return (
    <footer className="mt-12 border-t border-border bg-card">
      <Container className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:grid-cols-3 sm:py-12 lg:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))] lg:gap-x-8">
        <div className="col-span-2 space-y-4 sm:col-span-3 lg:col-span-1 lg:pr-6">
          <BrandMark className="h-14" />
          <div>
            <h2 className="font-heading text-sm font-semibold text-foreground">About Mithren Agro</h2>
            <p className="mt-2 max-w-sm text-[0.8125rem] leading-relaxed text-muted-foreground">
              A marketplace connecting farms, fresh produce and communities: produce, pantry staples, farm supplies and women’s apparel from
              independent sellers, in one cart.
            </p>
          </div>
          <Link href="/about" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary/40 px-4 text-sm font-medium text-primary transition-colors outline-none hover:border-primary hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring">
            About us
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <Column id="footer-shop" title="Shop" links={shopLinks} />
        <Column id="footer-support" title="Customer support" links={supportLinks} />
        <Column id="footer-policies" title="Policies" links={policyLinks} />
        <div className="space-y-5">
          <Column id="footer-grow" title="Grow with us" links={opportunityLinks} />
          <p className="text-xs leading-relaxed text-muted-foreground">Seller registration for farmers, stores and brands will open here.</p>
        </div>
      </Container>
      <div className="border-t border-border bg-band">
        <Container className="flex flex-col gap-1 py-4 text-xs text-secondary-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {siteConfig.legalName}. All rights reserved.</p>
          <p>Preview storefront · listings, prices and sellers are sample data · policies are drafts under legal review</p>
        </Container>
      </div>
    </footer>
  );
}
