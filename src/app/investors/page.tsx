import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CircleCheck,
  FileSearch,
  FileText,
  LockKeyhole,
  Megaphone,
  MonitorSmartphone,
  MessagesSquare,
  ShieldAlert,
  Sprout,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ExternalCta } from "@/components/opportunities/ExternalCta";
import { FaqList, type Faq } from "@/components/opportunities/FaqList";
import { OpportunityHero } from "@/components/opportunities/OpportunityHero";
import { ProvisionalNotice } from "@/components/opportunities/ProvisionalNotice";
import { SectionTitle } from "@/components/opportunities/SectionTitle";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { externalLinks } from "@/config/external-links";

export const metadata: Metadata = {
  title: "Investor Opportunities",
  description: "Learn about Mithren Agro and how prospective investors can review opportunities. Not an offer of securities.",
};

// Information only: no return, profit, dividend, capital protection or acceptance is promised, and
// nothing here is an offer. Eligibility, rights, returns, risks and terms depend on official
// documents. "Access Investor Portal" links to the separate Investor Portal application
// (NEXT_PUBLIC_INVESTOR_PORTAL_URL); when that is not configured the button says it is unavailable.

const portalNote = "The Investor Portal link has not been configured for this site yet.";

const business: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: Store, title: "A multi-seller marketplace", text: "Independent farmers, stores and brands list produce, pantry staples, farm supplies and apparel in one storefront." },
  { Icon: Sprout, title: "Local agriculture first", text: "The marketplace is built around local agricultural sellers and the customers near them." },
  { Icon: Truck, title: "Sellers, agents and delivery", text: "Seller and delivery agents are planned to support onboarding and local delivery." },
  { Icon: MonitorSmartphone, title: "Technology at the centre", text: "A customer storefront alongside separate applications for sellers, delivery and investors, built around one marketplace." },
];

const benefits: { Icon: LucideIcon; text: string }[] = [
  { Icon: BarChart3, text: "Visibility into relevant business performance information, where authorised." },
  { Icon: Megaphone, text: "Access to investor communications and updates, if provided." },
  { Icon: FileSearch, text: "A structured process for reviewing investment opportunities." },
  { Icon: LockKeyhole, text: "A dedicated portal for eligible investors." },
  { Icon: FileText, text: "Access to relevant business documents, subject to authorisation." },
];

const process: { title: string; text: string }[] = [
  { title: "Learn about the business", text: "Read this page and any information Mithren Agro publishes for prospective investors." },
  { title: "Express interest", text: "Use the Investor Portal, once available to you, to register interest and see what you are authorised to view." },
  { title: "Review the official documents", text: "Eligible investors receive the documents that set out the opportunity, its terms and its risks." },
  { title: "Decide, with independent advice", text: "Any participation follows the official documentation and the applicable eligibility checks." },
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
  { q: "Is this page an offer to invest?", a: "No. It is general information about Mithren Agro. Any opportunity is governed only by the official documentation provided to eligible investors." },
  { q: "What returns can I expect?", a: "No return, profit or dividend is promised. Returns, rights and risks depend entirely on the terms in the official documents." },
  { q: "Who is eligible to invest?", a: "Eligibility is defined in the official documentation and may depend on verification checks and applicable regulations." },
  { q: "What is the Investor Portal?", a: "A separate Mithren Agro application for eligible investors, with its own sign-in. This storefront only links to it and never asks for investor credentials." },
  { q: "How can I contact Mithren Agro about investing?", a: <>Through the Investor Portal once it is available to you. Official contact details for investor enquiries will be published here and on the <Link href="/support#contact" className="font-medium text-primary underline-offset-4 hover:underline">Help &amp; support</Link> page; none has been published yet.</> },
  { q: "Is the Investor Portal related to my shopping account?", a: "No. Shopping, the demo customer account and the Investor Portal are separate. Signing in to one does not sign you in to another." },
];

export default function InvestorsPage() {
  return (
    <main id="main-content" className="flex-1">
      <OpportunityHero
        breadcrumb="Investor Opportunities"
        eyebrow="For investors"
        title="Investor Opportunities at Mithren Agro"
        image={{ src: "/images/home/hero-pantry.jpg", alt: "Pulses and grains arranged in a flower pattern" }}
        actions={
          <>
            <ExternalCta
              id="portal-hero"
              href={externalLinks.investorPortal}
              label="Access Investor Portal"
              unavailableLabel="Investor Portal: coming soon"
              unavailableNote={portalNote}
              className="px-6"
            />
            <Button asChild variant="outline" className="px-6">
              <Link href="#risks">Read the risk disclosure<ArrowRight aria-hidden="true" /></Link>
            </Button>
          </>
        }
      >
        <p>
          Mithren Agro is building a farm-to-home marketplace for independent agricultural sellers. This page introduces the business and explains how
          prospective investors can learn more. It is information, not an offer.
        </p>
      </OpportunityHero>

      <Container className="space-y-12 py-8 sm:space-y-16 sm:py-12">
        <ProvisionalNotice title="Proposed information — subject to official documentation">
          Investor eligibility, rights, returns, risks and terms depend on official documents, which are provided only to eligible investors. Nothing on
          this page is a guarantee, a recommendation or a legally binding commitment.
        </ProvisionalNotice>

        <section aria-labelledby="business-title">
          <SectionTitle id="business-title" eyebrow="The business">An agricultural marketplace</SectionTitle>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {business.map(({ Icon, title, text }) => (
              <li key={title} className="surface-card rounded-3xl p-5 sm:p-6">
                <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><Icon className="size-6" aria-hidden="true" /></span>
                <h3 className="mt-4 font-heading text-base font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="opportunity-title" className="grid gap-6 lg:grid-cols-2 lg:gap-12">
          <div>
            <SectionTitle id="opportunity-title" eyebrow="The opportunity">Why investors may be interested</SectionTitle>
            <p className="mt-3 text-muted-foreground">
              Mithren Agro may offer eligible investors the chance to review opportunities to participate in the business as it grows. The scope,
              structure and timing of any opportunity will be set out only in the official documents.
            </p>
          </div>
          <div className="surface-card rounded-3xl p-5 sm:p-6">
            <h3 className="flex flex-wrap items-center gap-2 font-heading text-base font-semibold">
              Proposed investor benefits
              <span className="rounded-full bg-highlight/40 px-2.5 py-0.5 text-xs font-medium text-foreground">Subject to official documentation</span>
            </h3>
            <ul className="mt-4 grid gap-3">
              {benefits.map(({ Icon, text }) => (
                <li key={text} className="flex gap-3 text-sm leading-relaxed">
                  <Icon className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="process-title">
          <SectionTitle id="process-title" eyebrow="The process">How the investment process is planned to work</SectionTitle>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {process.map(({ title, text }, index) => (
              <li key={title} className="surface-card rounded-3xl p-5">
                <span className="grid size-10 place-items-center rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground" aria-hidden="true">{index + 1}</span>
                <h3 className="mt-4 font-heading text-base font-semibold"><span className="sr-only">Step {index + 1}: </span>{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
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
