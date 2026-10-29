import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, CircleCheck, MessagesSquare, ShieldAlert } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ExternalCta } from "@/components/opportunities/ExternalCta";
import { FaqList, type Faq } from "@/components/opportunities/FaqList";
import { DomainCard, PlanCard } from "@/components/opportunities/InvestmentCards";
import { OpportunityHero } from "@/components/opportunities/OpportunityHero";
import { ProvisionalNotice } from "@/components/opportunities/ProvisionalNotice";
import { SectionTitle } from "@/components/opportunities/SectionTitle";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { externalLinks } from "@/config/external-links";
import { brochureDurationStages } from "@/data/investments";
import { projectsByDomain, selectionHref } from "@/lib/investments";
import { getInvestmentDomains, getInvestmentPlans, getInvestmentProjects } from "@/services/investments";

export const metadata: Metadata = {
  title: "Investor Opportunities",
  description: "Mithren Agro's 12 agricultural projects across six domains, and the contribution amounts investors can choose. Information only, not an offer.",
};

// Information only: no return, profit, dividend, capital protection or acceptance is promised, and
// nothing here is an offer. Mithren Agro runs 12 agricultural projects, two in each of six domains,
// and investors choose a contribution amount and a project. Projects, amounts and every unconfirmed
// detail come from data/investments.ts (durations, eligibility and allocation rules are not confirmed
// yet, so they read "awaiting confirmation"). This page introduces the concept; /investors/projects
// lists the projects and /investors/plan lets a visitor choose and review a plan and a project. The
// next step is the separate Investor Portal application (NEXT_PUBLIC_INVESTOR_PORTAL_URL); when that
// is not configured the buttons say it is unavailable. No investment is made on this site.

const portalNote = "The Investor Portal link has not been configured for this site yet.";

const process: { title: string; text: string }[] = [
  { title: "Learn about the domains", text: "Crop production, dairy, fish and poultry farming, biogas and composting, and agri forestry." },
  { title: "Explore the 12 projects", text: "Two projects in each domain, with the details Mithren Agro has confirmed so far." },
  { title: "Choose an amount and a project", text: "Pick one of the five contribution amounts and the project you are interested in." },
  { title: "Review your selection", text: "See your choice in one place. Nothing is submitted and no payment is taken here." },
  { title: "Continue through the Investor Portal", text: "Eligibility checks, official documents and any agreement happen there, not on this site." },
];

const eligibility = [
  "Participation is limited to investors who meet the eligibility criteria set out in the official documentation.",
  "Identity and other verification checks may be required before any document is shared.",
  "Applicable laws and regulations may restrict who can take part and how.",
  "Mithren Agro may decline any expression of interest; registering interest does not guarantee acceptance.",
];

const risks = [
  "Investing in an early-stage business carries a high level of risk, including the possible loss of all the money invested.",
  "There is no guarantee of returns, profits, dividends or capital protection.",
  "Investments of this kind may be illiquid: it may not be possible to sell or exit when you wish.",
  "Past or projected performance is not a reliable indicator of future results.",
  "Seek independent financial, legal and tax advice before making any decision.",
];

const faqs: Faq[] = [
  { q: "Is this page an offer to invest?", a: "No. It is general information about Mithren Agro's agricultural projects. Any opportunity is governed only by the official documentation provided to eligible investors." },
  { q: "What returns can I expect?", a: "No return, profit or dividend is promised, and none is shown on this site. Returns, rights and risks depend entirely on the terms in the official documents." },
  { q: "How long does each plan run?", a: `Not confirmed yet. The plan brochure lists stages of ${brochureDurationStages.join(", ")}, but which applies to each amount is still to be confirmed. Each plan's duration will appear here once Mithren Agro confirms it.` },
  { q: "Can one plan fund more than one project, or can I combine plans?", a: "Not confirmed yet. This will be set out in the official documentation. Until then, the selection page lets you choose one amount and one project." },
  { q: "What happens when I review a selection?", a: "Nothing is submitted, saved or charged. The review summarises your choice so you can continue through the Investor Portal, where eligibility checks and the official documents apply." },
  { q: "Who is eligible to invest?", a: "Eligibility is defined in the official documentation and may depend on verification checks and applicable regulations." },
  { q: "What is the Investor Portal?", a: "A separate Mithren Agro application for eligible investors, with its own sign-in. This storefront only links to it and never asks for investor credentials or payment." },
  { q: "How can I contact Mithren Agro about investing?", a: <>Through the Investor Portal once it is available to you. Official contact details for investor enquiries will be published here and on the <Link href="/support#contact" className="font-medium text-primary underline-offset-4 hover:underline">Help &amp; support</Link> page; none has been published yet.</> },
  { q: "Is the Investor Portal related to my shopping account?", a: "No. Shopping, the demo customer account and the Investor Portal are separate. Signing in to one does not sign you in to another." },
];

export default async function InvestorsPage() {
  const [domains, projects, plans] = await Promise.all([getInvestmentDomains(), getInvestmentProjects(), getInvestmentPlans()]);
  const groups = projectsByDomain(projects, domains);

  return (
    <main id="main-content" className="flex-1">
      <OpportunityHero
        breadcrumb="Investor Opportunities"
        eyebrow="For investors"
        title="Investor Opportunities"
        image={{ src: "/images/home/farm-essentials.jpg", alt: "Young green seedlings growing in rows of soil" }}
        actions={
          <>
            <Button asChild className="px-6">
              <Link href="/investors/projects">Explore the {projects.length} projects<ArrowRight aria-hidden="true" /></Link>
            </Button>
            <Button asChild variant="outline" className="px-6">
              <Link href={selectionHref()}>Choose a plan</Link>
            </Button>
          </>
        }
      >
        <p>
          Mithren Agro runs {projects.length} agricultural projects across {domains.length} domains: crop production, dairy farming, fish farming,
          poultry farming, biogas and composting, and agri forestry. Choose a contribution amount and a project to support. This is information,
          not an offer.
        </p>
      </OpportunityHero>

      <Container className="space-y-12 py-8 sm:space-y-16 sm:py-12">
        <ProvisionalNotice title="Proposed information — subject to official documentation">
          Project details, plan durations, which plans apply to which projects, eligibility, rights, risks and terms are still being confirmed and
          will be set out only in official documents provided to eligible investors. Nothing on this page is a guarantee, a recommendation or a
          legally binding commitment, and no investment can be made on this site.
        </ProvisionalNotice>

        <section aria-labelledby="domains-title">
          <SectionTitle id="domains-title" eyebrow="Six domains · 12 projects">Agricultural domains</SectionTitle>
          <p className="mt-2 max-w-2xl text-muted-foreground">Each domain has two projects. Open a domain to see its projects and what has been confirmed about them.</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map(({ domain, projects: list }) => (
              <li key={domain.id}><DomainCard domain={domain} projects={list} /></li>
            ))}
          </ul>
        </section>

        <section id="plans" aria-labelledby="plans-title" className="scroll-mt-6 lg:scroll-mt-36">
          <SectionTitle id="plans-title" eyebrow="Investment plans">Contribution amounts</SectionTitle>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Five amounts to choose from. Each plan&apos;s duration, and which projects it applies to, are awaiting confirmation; no rate, return or
            payout is offered here.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {plans.map((plan) => (
              <li key={plan.id}><PlanCard plan={plan} /></li>
            ))}
          </ul>
          <p className="mt-4 flex max-w-3xl gap-2 text-xs leading-relaxed text-muted-foreground">
            <CalendarClock className="mt-px size-3.5 shrink-0 text-brand" aria-hidden="true" />
            The plan brochure lists stages of {brochureDurationStages.join(", ")}. Which stage applies to each amount will be shown once Mithren Agro
            confirms it.
          </p>
        </section>

        <section aria-labelledby="process-title">
          <SectionTitle id="process-title" eyebrow="How it works">From exploring to the Investor Portal</SectionTitle>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {process.map(({ title, text }, index) => (
              <li key={title} className="surface-card rounded-3xl p-5">
                <span className="grid size-10 place-items-center rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground" aria-hidden="true">{index + 1}</span>
                <h3 className="mt-4 font-heading text-base font-semibold"><span className="sr-only">Step {index + 1}: </span>{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
          <Button asChild className="mt-6">
            <Link href={selectionHref()}>Choose a plan and a project<ArrowRight aria-hidden="true" /></Link>
          </Button>
        </section>

        <section aria-labelledby="eligibility-title" className="rounded-3xl bg-soft p-5 ring-1 ring-border sm:p-8">
          <SectionTitle id="eligibility-title" eyebrow="Eligibility">Eligibility and participation requirements</SectionTitle>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {eligibility.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <CircleCheck className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section id="risks" aria-labelledby="risks-title" className="scroll-mt-6 rounded-3xl border border-warning/30 bg-card p-5 sm:p-8 lg:scroll-mt-36">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-6 shrink-0 text-warning" aria-hidden="true" />
            <Heading id="risks-title" variant="h2" className="lg:text-3xl">Risks and disclosures</Heading>
          </div>
          <ul className="mt-5 grid gap-3">
            {risks.map((risk) => (
              <li key={risk} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                {risk}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-muted-foreground">
            The full risk disclosure, terms and any regulatory statements will be provided in the official documentation.
          </p>
        </section>

        <section aria-labelledby="faq-title" className="max-w-3xl">
          <SectionTitle id="faq-title" eyebrow="FAQ">Questions from prospective investors</SectionTitle>
          <div className="mt-5"><FaqList faqs={faqs} /></div>
        </section>

        <section aria-labelledby="portal-title" className="surface-primary relative overflow-hidden rounded-3xl p-6 sm:p-10">
          <MessagesSquare className="absolute -right-6 -bottom-6 size-40 text-primary-foreground/10" aria-hidden="true" />
          <Heading id="portal-title" variant="h2" className="text-primary-foreground lg:text-3xl">Investor Portal</Heading>
          <p className="mt-2 max-w-xl text-sm text-primary-foreground/85 sm:text-base">
            Eligible investors sign in to the separate Investor Portal to see the information and documents they are authorised to view.
          </p>
          <div className="mt-6 [&_p]:text-primary-foreground/80">
            <ExternalCta
              id="portal-footer"
              href={externalLinks.investorPortal}
              label="Access Investor Portal"
              unavailableLabel="Investor Portal: coming soon"
              unavailableNote={portalNote}
              variant="outline"
              className="h-12 px-7 disabled:border-transparent disabled:bg-card disabled:text-muted-foreground"
            />
          </div>
        </section>
      </Container>
    </main>
  );
}
