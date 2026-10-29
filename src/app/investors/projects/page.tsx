import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { ProjectCard } from "@/components/opportunities/InvestmentCards";
import { domainIcons } from "@/components/opportunities/investment-icons";
import { ProvisionalNotice } from "@/components/opportunities/ProvisionalNotice";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { projectsByDomain, selectionHref } from "@/lib/investments";
import { getInvestmentDomains, getInvestmentProjects } from "@/services/investments";

export const metadata: Metadata = {
  title: "Agricultural projects",
  description: "Mithren Agro's 12 agricultural projects: two in each of six domains. Information only, not an offer.",
};

// All 12 projects, grouped by domain (each group has the domain's slug as its id, so the domain cards
// link straight to it). Names and summaries are labelled placeholders until approved details are
// added to data/investments.ts.
export default async function InvestmentProjectsPage() {
  const [domains, projects] = await Promise.all([getInvestmentDomains(), getInvestmentProjects()]);
  const groups = projectsByDomain(projects, domains);

  return (
    <main id="main-content" className="flex-1">
      <section aria-labelledby="page-title" className="bg-soft">
        <Container className="pt-4 pb-8 sm:pt-6 sm:pb-10">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Investor Opportunities", href: "/investors" }, { label: "Projects" }]} />
          <p className="mt-5 text-xs font-semibold tracking-wide text-brand uppercase">Investor Opportunities</p>
          <Heading as="h1" id="page-title" variant="h1" className="mt-2 text-balance lg:text-5xl">
            The {projects.length} agricultural projects
          </Heading>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-foreground/80 sm:text-base">
            Two projects in each of {domains.length} domains. Open a project for what has been confirmed so far, or select one to review with a
            contribution amount.
          </p>
          <nav aria-label="Domains" className="mt-6">
            <ul className="flex flex-wrap gap-2">
              {domains.map((domain) => {
                const Icon = domainIcons[domain.slug];
                return (
                  <li key={domain.id}>
                    <Link
                      href={`#${domain.slug}`}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground/85 outline-none hover:border-primary/35 hover:text-brand focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon className="size-4 text-brand" aria-hidden="true" />
                      {domain.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </Container>
      </section>

      <Container className="space-y-10 py-8 sm:space-y-14 sm:py-12">
        <ProvisionalNotice title="Project details are being confirmed">
          Every project below is a labelled placeholder. Names, locations, scope and which contribution amounts each project accepts will appear
          here once Mithren Agro confirms them. Nothing on this page is an offer.
        </ProvisionalNotice>

        {groups.map(({ domain, projects: list }) => (
          <section key={domain.id} id={domain.slug} aria-labelledby={`${domain.slug}-title`} className="scroll-mt-6 lg:scroll-mt-36">
            <Heading id={`${domain.slug}-title`} variant="h2" className="lg:text-2xl">{domain.name}</Heading>
            <p className="mt-1 text-sm text-muted-foreground">{domain.summary}</p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {list.map((project) => (
                <li key={project.id}><ProjectCard project={project} domain={domain} /></li>
              ))}
            </ul>
          </section>
        ))}

        <div className="flex flex-col gap-3 rounded-3xl bg-soft p-5 ring-1 ring-border sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="font-heading text-base font-semibold">Ready to compare? Choose an amount and a project.</p>
          <Button asChild>
            <Link href={selectionHref()}>Choose a plan<ArrowRight aria-hidden="true" /></Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
