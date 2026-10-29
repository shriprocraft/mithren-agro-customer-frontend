import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Handshake, Layers, Scale, ShoppingBasket, Store, TrendingUp, type LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { OpportunityHero } from "@/components/opportunities/OpportunityHero";
import { ProvisionalNotice } from "@/components/opportunities/ProvisionalNotice";
import { SectionTitle } from "@/components/opportunities/SectionTitle";
import { Button } from "@/components/ui/button";
import { shopHref } from "@/lib/browse";
import { getCategories } from "@/services/catalog";

export const metadata: Metadata = {
  title: "About Us",
  description: "Mithren Agro is building an agricultural marketplace that connects farms, fresh produce and communities.",
};

// Only what is true of this storefront today; no founding year, team size, farmer or customer counts,
// certifications or delivery promises are stated. Company details are left for the owner to add.

const principles: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: Store, title: "Sellers named on every item", text: "Each listing shows who sells it, so you know where your shopping comes from." },
  { Icon: Scale, title: "Clear pack sizes and prices", text: "Prices are shown per pack, weight or size, and each option is priced on its own." },
  { Icon: BadgeCheck, title: "Labels only after review", text: "Organic or similar labels are shown only once the supporting documents have been reviewed." },
  { Icon: Layers, title: "One cart for everything", text: "Produce, pantry staples, farm supplies and apparel from different sellers in a single order." },
];

const steps = [
  { title: "Browse", text: "Search the marketplace or start from a category." },
  { title: "Choose", text: "Pick the weight, pack or size you need and add it to your cart." },
  { title: "Check out", text: "Add a delivery address and place your order, then follow its status." },
];

export default async function AboutPage() {
  const categories = await getCategories();
  return (
    <main id="main-content" className="flex-1">
      <OpportunityHero
        breadcrumb="About Us"
        eyebrow="About us"
        title="About Mithren Agro"
        image={{ src: "/images/home/hero-slide-farm-crate.jpg", alt: "Mithren Agro crate full of fresh vegetables on a farm table at sunrise" }}
        actions={
          <>
            <Button asChild className="px-6"><Link href="/products">Explore Marketplace<ArrowRight aria-hidden="true" /></Link></Button>
            <Button asChild variant="outline" className="px-6"><Link href="#grow-title">Grow with us</Link></Button>
          </>
        }
      >
        <p>
          Connecting farms, fresh produce, and communities through a convenient agricultural marketplace. Discover quality produce and explore
          opportunities to grow with Mithren Agro.
        </p>
      </OpportunityHero>

      <Container className="space-y-12 py-8 sm:space-y-16 sm:py-12">
        <section aria-labelledby="who-title" className="grid gap-6 lg:grid-cols-2 lg:gap-12">
          <div>
            <SectionTitle id="who-title" eyebrow="Who we are">A marketplace built around farms</SectionTitle>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Mithren Agro brings independent farmers, stores and brands together in one storefront, so customers can buy fresh produce and
              everyday essentials in one place, and sellers can reach more of the people around them.
            </p>
            <p>
              Alongside shopping, we are building ways for people to take part: as Seller Agents who help local sellers come online, as Delivery
              Agents, and as investors who want to learn about the business.
            </p>
          </div>
        </section>

        <section aria-labelledby="shop-title">
          <SectionTitle id="shop-title" eyebrow="What you can shop">Nine categories, one cart</SectionTitle>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={shopHref(category.slug)} className="group surface-card flex h-full flex-col rounded-2xl p-4 outline-none hover:shadow-[var(--elevation-overlay)] focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="flex items-center justify-between gap-2 font-heading font-semibold">
                    {category.name}
                    <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">{category.short_description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="principles-title">
          <SectionTitle id="principles-title" eyebrow="How we work">What you can expect on the marketplace</SectionTitle>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ Icon, title, text }) => (
              <li key={title} className="rounded-3xl bg-soft p-5 ring-1 ring-border">
                <span className="grid size-11 place-items-center rounded-full bg-card text-primary"><Icon className="size-5" aria-hidden="true" /></span>
                <h3 className="mt-4 font-heading text-base font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-title" className="surface-card rounded-3xl p-5 sm:p-8">
          <SectionTitle id="how-title" eyebrow="Shopping">How it works</SectionTitle>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground" aria-hidden="true">{i + 1}</span>
                <span>
                  <span className="block font-heading font-semibold"><span className="sr-only">Step {i + 1}: </span>{step.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-muted-foreground">
            This storefront is a preview: listings, prices and sellers are sample data, and orders are not charged or delivered yet.
          </p>
        </section>

        <section aria-labelledby="grow-title" className="scroll-mt-6 lg:scroll-mt-36">
          <SectionTitle id="grow-title" eyebrow="Grow with us">Opportunities with Mithren Agro</SectionTitle>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              { href: "/agent-benefits", Icon: Handshake, title: "Agent Benefits", text: "How Seller Agents and Delivery Agents could take part in the marketplace." },
              { href: "/investors", Icon: TrendingUp, title: "Investor Opportunities", text: "Learn about the business and how prospective investors can find out more." },
            ].map(({ href, Icon, title, text }) => (
              <Link key={href} href={href} className="group surface-card flex items-start gap-4 rounded-3xl p-5 outline-none hover:shadow-[var(--elevation-overlay)] focus-visible:ring-2 focus-visible:ring-ring sm:p-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-primary"><Icon className="size-6" aria-hidden="true" /></span>
                <span>
                  <span className="flex items-center gap-2 font-heading text-lg font-semibold">
                    {title}
                    <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{text}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <ProvisionalNotice title="Company details to be added">
          The company’s registered address, registration details and official contact channels will be published here and on the{" "}
          <Link href="/support" className="font-medium text-primary underline underline-offset-4">Help &amp; support</Link> page once confirmed.
        </ProvisionalNotice>

        <section aria-labelledby="start-title" className="flex flex-col items-start gap-4 rounded-3xl bg-soft p-6 ring-1 ring-border sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <ShoppingBasket className="size-8 shrink-0 text-brand" aria-hidden="true" />
            <h2 id="start-title" className="font-heading text-xl font-semibold">Ready to start shopping?</h2>
          </div>
          <Button asChild size="lg"><Link href="/products">Explore Marketplace<ArrowRight aria-hidden="true" /></Link></Button>
        </section>
      </Container>
    </main>
  );
}
