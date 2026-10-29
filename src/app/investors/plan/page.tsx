import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { InvestmentSelector } from "@/components/opportunities/InvestmentSelector";
import { Heading } from "@/components/ui/typography";
import { externalLinks } from "@/config/external-links";
import { getAllocationRules, getInvestmentDomains, getInvestmentPlans, getInvestmentProjects } from "@/services/investments";

export const metadata: Metadata = {
  title: "Choose a plan and a project",
  description: "Choose a contribution amount and one of Mithren Agro's agricultural projects, then review your selection. Nothing is submitted here.",
};

// The selector reads ?plan= and ?project=, so it renders on the client inside its own boundary; the
// fallback keeps the page's height so nothing jumps when it appears.
export default async function InvestmentPlanPage() {
  const [domains, projects, plans, rules] = await Promise.all([getInvestmentDomains(), getInvestmentProjects(), getInvestmentPlans(), getAllocationRules()]);

  return (
    <main id="main-content" className="flex-1">
      <Container className="pt-4 pb-12 sm:pt-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Investor Opportunities", href: "/investors" }, { label: "Choose a plan" }]} />
        <Heading as="h1" variant="h1" className="mt-5 text-balance">Choose a plan and a project</Heading>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Pick a contribution amount and the project you’d like to support, then review your selection. This is a preview: nothing is submitted
          and no payment is taken on this site.
        </p>
        <div className="mt-6 sm:mt-8">
          <Suspense fallback={<div className="h-[48rem] animate-pulse rounded-3xl bg-muted motion-reduce:animate-none" aria-label="Loading plan selection" />}>
            <InvestmentSelector domains={domains} projects={projects} plans={plans} rules={rules} portalHref={externalLinks.investorPortal} />
          </Suspense>
        </div>
      </Container>
    </main>
  );
}
