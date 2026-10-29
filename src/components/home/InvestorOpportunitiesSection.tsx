import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Container } from "@/components/layout/Container";
import { DomainVisual } from "@/components/opportunities/InvestmentCards";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/formatters";
import { projectsByDomain } from "@/lib/investments";
import type { InvestmentDomain, InvestmentPlan, InvestmentProject } from "@/types/investment";

interface InvestorOpportunitiesSectionProps {
  domains: InvestmentDomain[];
  projects: InvestmentProject[];
  plans: InvestmentPlan[];
}

// A short introduction on the homepage: the six domains (two projects each), the five contribution
// amounts and one call to action into /investors, where the projects, plans and selection live. No
// rate, return or duration is shown: none has been confirmed (data/investments.ts).
export function InvestorOpportunitiesSection({ domains, projects, plans }: InvestorOpportunitiesSectionProps) {
  const groups = projectsByDomain(projects, domains);

  return (
    <section id="investor-opportunities" aria-labelledby="investor-opportunities-title" className="scroll-mt-4 py-6 sm:py-10 lg:scroll-mt-32">
      <Container>
        <div className="surface-card rounded-[2rem] px-4 py-6 sm:px-8 sm:py-9 lg:px-10">
          <SectionHeading
            id="investor-opportunities-title"
            eyebrow="Grow with us"
            title="Investor Opportunities"
            description={`Support agricultural projects across crop production, dairy farming, fish farming, poultry farming, biogas and composting, and agri forestry: ${projects.length} projects in ${domains.length} domains, each open to a choice of contribution amounts.`}
          />
          <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
            {groups.map(({ domain, projects: domainProjects }) => (
              <li key={domain.id}>
                <Link
                  href={`/investors/projects#${domain.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-2 outline-none transition hover:border-primary/30 hover:shadow-[var(--elevation-card)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <DomainVisual domain={domain} className="aspect-[16/10]" sizes="(min-width: 1280px) 200px, (min-width: 768px) 30vw, 45vw" />
                  <span className="flex flex-1 flex-col px-1 pt-2 pb-0.5">
                    <span className="font-heading text-sm leading-snug font-semibold text-foreground sm:text-[0.9375rem]">{domain.name}</span>
                    <span className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      {domainProjects.length} projects
                      <ArrowRight className="size-3.5 text-brand transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-5 rounded-3xl bg-soft p-4 ring-1 ring-border sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10">
            <div>
              <h3 className="font-heading text-base font-semibold">Contribution amounts</h3>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Contribution amounts">
                {plans.map((plan) => (
                  <li key={plan.id} className="rounded-full border border-border bg-card px-4 py-1.5 font-heading text-[0.9375rem] font-semibold text-foreground">
                    {formatPrice(plan.amount)}
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex gap-2 text-xs leading-relaxed text-muted-foreground">
                <CalendarClock className="mt-px size-3.5 shrink-0 text-brand" aria-hidden="true" />
                Durations, eligibility and terms are awaiting confirmation from Mithren Agro. No return is promised.
              </p>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/investors">
                Explore Investment Opportunities
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
