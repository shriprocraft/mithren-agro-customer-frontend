import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sprout } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { DomainVisual } from "@/components/opportunities/InvestmentCards";
import { OpportunityHero } from "@/components/opportunities/OpportunityHero";
import { SectionTitle } from "@/components/opportunities/SectionTitle";
import { Button } from "@/components/ui/button";
import { getInvestmentDomains } from "@/services/investments";

export const metadata: Metadata = {
  title: "Investor Opportunities: coming soon",
  description: "Mithren Agro investment opportunities are being prepared and will be available soon. Investing isn't available on this site.",
};

// Coming soon. Investing isn't available, so this page has no amounts, plans, projects or investment
// actions, and it doesn't link to any other application. The earlier journey is kept, unrouted, in
// app/_investor-journey (docs/ARCHITECTURE.md); next.config.ts sends its old URLs here.
export default async function InvestorsPage() {
  const domains = await getInvestmentDomains();

  return (
    <main id="main-content" className="flex-1">
      <OpportunityHero
        breadcrumb="Investor Opportunities"
        eyebrow="Coming soon"
        title="Investor Opportunities"
        image={{ src: "/images/home/farm-essentials.jpg", alt: "Young green seedlings growing in rows of soil" }}
        actions={
          <>
            <Button asChild className="px-6">
              <Link href="/products">Shop fresh produce<ArrowRight aria-hidden="true" /></Link>
            </Button>
            <Button asChild variant="outline" className="px-6">
              <Link href="/about">About Mithren Agro</Link>
            </Button>
          </>
        }
      >
        <p>Mithren Agro investment opportunities are being prepared and will be available soon.</p>
      </OpportunityHero>

      <Container className="space-y-8 py-8 sm:space-y-10 sm:py-12">
        <section aria-labelledby="domains-title">
          <SectionTitle id="domains-title" eyebrow="What we’re preparing">Six agricultural domains</SectionTitle>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domains.map((domain) => (
              <li key={domain.id} className="surface-card rounded-3xl p-3 sm:p-4">
                <DomainVisual domain={domain} className="aspect-[16/9]" />
                <h3 className="mt-3 px-1 font-heading text-base leading-snug font-semibold">{domain.name}</h3>
                <p className="mt-1 px-1 text-sm text-muted-foreground">{domain.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <p role="note" className="flex gap-3 rounded-3xl bg-soft p-5 text-sm leading-relaxed text-foreground/85 ring-1 ring-border sm:p-6">
          <Sprout className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
          Investing isn’t available yet, so you can’t make an investment or commitment on this site. Nothing on this page is an offer, and no return is promised.
        </p>
      </Container>
    </main>
  );
}
