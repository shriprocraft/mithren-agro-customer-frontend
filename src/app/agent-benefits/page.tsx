import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CircleCheck,
  ClipboardList,
  FileText,
  Handshake,
  PackageCheck,
  Route,
  Store,
  Truck,
  UserCheck,
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
  title: "Agent Benefits",
  description: "How Seller Agents and Delivery Agents could take part in Mithren Agro. Proposed benefits, subject to final company policy.",
};

// Everything on this page is provisional: benefits and responsibilities are proposals, not company
// policy. No earnings, salary, employment status, insurance, amount of work or eligibility is
// promised, and the application buttons stay disabled until NEXT_PUBLIC_*_AGENT_APPLY_URL is set.

const agents = {
  seller: {
    id: "seller-agent",
    Icon: Store,
    name: "Seller Agent",
    summary: "Help local farmers and agricultural suppliers reach more customers through the marketplace.",
    benefits: [
      "Potential access to customer demand through the marketplace.",
      "Connect local farmers and customers in your area.",
      "Help local agricultural businesses reach more buyers.",
      "Use digital tools to manage eligible product listings and the catalogue.",
      "Keep prices and product availability up to date for the sellers you support.",
      "Help coordinate orders between sellers and the marketplace.",
      "See your assigned responsibilities and eligible earnings clearly.",
      "Build lasting relationships with local farmers and customers.",
      "Training and onboarding resources, if offered.",
      "Transparent information about applicable commissions and payment schedules.",
      "Room to grow alongside the marketplace as it expands, subject to the final business model.",
    ],
    responsibilities: [
      "Help onboard eligible sellers and agricultural suppliers.",
      "Assist with product information and listing accuracy.",
      "Follow applicable quality, verification and platform policies.",
      "Support seller-related coordination when required.",
      "Communicate honestly with customers and suppliers.",
    ],
  },
  delivery: {
    id: "delivery-agent",
    Icon: Truck,
    name: "Delivery Agent",
    summary: "Support local agricultural deliveries and help orders reach customers carefully and on time.",
    benefits: [
      "Support local agricultural delivery operations.",
      "Flexible availability, where the operational model permits.",
      "Clear delivery assignments and order information.",
      "Transparent visibility into applicable delivery payments.",
      "Potential earning opportunities, subject to the actual business model.",
      "Contribute to faster and more reliable deliveries.",
      "Delivery instructions and onboarding resources, if offered.",
    ],
    responsibilities: [
      "Deliver assigned orders according to platform procedures.",
      "Handle agricultural products with care.",
      "Follow delivery instructions and customer communication guidelines.",
      "Meet customer service expectations: be courteous, careful and on time.",
      "Keep delivery status updates accurate.",
      "Follow applicable safety and verification procedures.",
    ],
  },
} as const;

const steps: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: ClipboardList, title: "Choose a role", text: "Pick Seller Agent or Delivery Agent, depending on how you would like to take part." },
  { Icon: FileText, title: "Apply", text: "Submit an application once registration opens. Applications are not being accepted yet." },
  { Icon: UserCheck, title: "Verification", text: "Mithren Agro reviews eligibility and completes the verification steps it announces." },
  { Icon: BookOpen, title: "Onboarding", text: "Approved agents receive onboarding, the platform guidelines and the confirmed terms." },
];

const onboarding = [
  "An introduction to the marketplace, its sellers and how orders flow.",
  "Platform policies, quality standards and verification procedures.",
  "How to use the agent tools for listings, assignments and status updates.",
  "The confirmed earnings, commission or payment terms for your role.",
];

const policies = [
  "Agent terms and conditions",
  "Commission and delivery payment terms",
  "Eligibility and verification requirements",
  "Code of conduct and safety guidelines",
];

const faqs: Faq[] = [
  { q: "Can I apply now?", a: "Not yet. Registration has not opened. The application buttons on this page will work once it does." },
  { q: "How much will I earn?", a: "Earnings, commissions and payment terms have not been set. They will be confirmed during onboarding, and nothing on this page is a guarantee of income or of a minimum amount of work." },
  { q: "Am I employed by Mithren Agro as an agent?", a: "This page does not describe an employment relationship. The nature of the agent relationship will be defined in the official terms, which will be published before registration opens." },
  { q: "Who can become an agent?", a: "Eligibility and verification requirements will be announced. Meeting them will be required before onboarding." },
  { q: "Can I be both a Seller Agent and a Delivery Agent?", a: "That has not been decided. The official terms will say whether one person can hold both roles." },
  { q: "Are insurance or other benefits included?", a: "No such benefit is offered on this page. Any benefit that applies will be stated in the official terms." },
];

export default function AgentBenefitsPage() {
  return (
    <main id="main-content" className="flex-1">
      <OpportunityHero
        breadcrumb="Agent Benefits"
        eyebrow="Mithren Agents"
        title="Grow local agriculture as a Mithren Agent"
        image={{ src: "/images/home/marketplace-banner.jpg", alt: "Market stall with crates of colourful fruit and vegetables" }}
        actions={
          <>
            <Button asChild className="px-6">
              <Link href="#seller-agent">Explore Seller Opportunities<ArrowRight aria-hidden="true" /></Link>
            </Button>
            <Button asChild variant="outline" className="px-6">
              <Link href="#delivery-agent">Explore Delivery Opportunities<ArrowRight aria-hidden="true" /></Link>
            </Button>
          </>
        }
      >
        <p>
          Mithren Agro connects independent farmers and suppliers with customers. Agents could help on both sides: bringing local sellers onto the
          marketplace, or delivering their produce to customers’ homes.
        </p>
      </OpportunityHero>

      <Container className="space-y-12 py-8 sm:space-y-16 sm:py-12">
        <ProvisionalNotice title="Proposed benefits — subject to final company policy">
          The benefits and responsibilities below are proposals, not confirmed terms. Earnings and payment terms will be confirmed during onboarding,
          eligibility and verification requirements will be announced, and final terms and conditions will be published before registration opens.
        </ProvisionalNotice>

        <section aria-labelledby="opportunity-title" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-12">
          <div>
            <SectionTitle id="opportunity-title" eyebrow="The opportunity">Two ways to take part</SectionTitle>
            <p className="mt-3 text-muted-foreground">
              Agents would work alongside the marketplace in their own area. Choose the role that suits you; each has its own benefits and
              responsibilities.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {Object.values(agents).map(({ id, Icon, name, summary }) => (
              <li key={id}>
                <Link
                  href={`#${id}`}
                  className="group surface-card flex h-full flex-col rounded-3xl p-5 outline-none transition-shadow hover:shadow-[var(--elevation-overlay)] focus-visible:ring-2 focus-visible:ring-ring sm:p-6"
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><Icon className="size-6" aria-hidden="true" /></span>
                  <span className="mt-4 font-heading text-lg font-semibold">{name}</span>
                  <span className="mt-1 flex-1 text-sm text-muted-foreground">{summary}</span>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    See benefits and responsibilities
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {Object.values(agents).map((agent) => (
          <AgentSection key={agent.id} {...agent} />
        ))}

        <section aria-labelledby="eligibility-title" className="surface-card rounded-3xl p-5 sm:p-8">
          <SectionTitle id="eligibility-title" eyebrow="Eligibility">Who can apply</SectionTitle>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Eligibility and verification requirements will be announced before registration opens. They are expected to cover identity
            verification and agreement to the agent terms; Delivery Agents may also need to meet requirements that apply to deliveries. None of
            these has been finalised.
          </p>
        </section>

        <section aria-labelledby="how-title">
          <SectionTitle id="how-title" eyebrow="How it works">From interest to onboarding</SectionTitle>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ Icon, title, text }, index) => (
              <li key={title} className="surface-card relative rounded-3xl p-5">
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground" aria-hidden="true">{index + 1}</span>
                  <Icon className="size-5 text-brand" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold"><span className="sr-only">Step {index + 1}: </span>{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="onboarding-title" className="grid gap-6 rounded-3xl bg-soft p-5 ring-1 ring-border sm:p-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <SectionTitle id="onboarding-title" eyebrow="Onboarding">What onboarding is planned to cover</SectionTitle>
            <p className="mt-3 text-muted-foreground">Onboarding resources are being prepared and may change before launch.</p>
          </div>
          <CheckList items={onboarding} />
        </section>

        <section aria-labelledby="policies-title">
          <SectionTitle id="policies-title" eyebrow="Official policies">Terms and policies</SectionTitle>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            These documents will be published here before registration opens. Until then, nothing on this page is a contractual commitment.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {policies.map((policy) => (
              <li key={policy} className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-input/60 bg-card px-4 py-3.5 text-sm">
                <span className="flex items-center gap-3 font-medium"><FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />{policy}</span>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">Not yet published</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faq-title" className="max-w-3xl">
          <SectionTitle id="faq-title" eyebrow="FAQ">Questions about becoming an agent</SectionTitle>
          <div className="mt-5"><FaqList faqs={faqs} /></div>
        </section>

        <section aria-labelledby="cta-title" className="surface-primary relative overflow-hidden rounded-3xl p-6 sm:p-10">
          <Handshake className="absolute -right-6 -bottom-6 size-40 text-primary-foreground/10" aria-hidden="true" />
          <Heading id="cta-title" variant="h2" className="text-primary-foreground lg:text-3xl">Become a Mithren Agent</Heading>
          <p className="mt-2 max-w-xl text-sm text-primary-foreground/85 sm:text-base">
            Registration has not opened yet. When it does, the applications will be available here.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap [&_p]:text-primary-foreground/80">
            <ExternalCta
              id="apply-seller"
              href={externalLinks.sellerAgentApplication}
              label="Apply as a Seller Agent"
              unavailableLabel="Seller Agent applications: coming soon"
              unavailableNote="Applications open after the final terms are published."
              variant="outline"
              className="disabled:border-transparent disabled:bg-card disabled:text-muted-foreground"
            />
            <ExternalCta
              id="apply-delivery"
              href={externalLinks.deliveryAgentApplication}
              label="Apply as a Delivery Agent"
              unavailableLabel="Delivery Agent applications: coming soon"
              unavailableNote="Applications open after the final terms are published."
              variant="outline"
              className="disabled:border-transparent disabled:bg-card disabled:text-muted-foreground"
            />
          </div>
        </section>
      </Container>
    </main>
  );
}

function CheckList({ items, Icon = CircleCheck }: { items: readonly string[]; Icon?: LucideIcon }) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed">
          <Icon className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function AgentSection({ id, Icon, name, summary, benefits, responsibilities }: (typeof agents)[keyof typeof agents]) {
  const RoleIcon = id === "seller-agent" ? BadgeCheck : Route;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 lg:scroll-mt-36">
      <div className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><Icon className="size-7" aria-hidden="true" /></span>
        <div>
          <p className="text-xs font-semibold tracking-wide text-brand uppercase">Agent role</p>
          <Heading id={`${id}-title`} variant="h2" className="mt-0.5 lg:text-3xl">{name}</Heading>
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-muted-foreground">{summary}</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="surface-card rounded-3xl p-5 sm:p-6">
          <h3 className="flex flex-wrap items-center gap-2 font-heading text-base font-semibold">
            <PackageCheck className="size-5 text-brand" aria-hidden="true" />
            Proposed benefits
            <span className="rounded-full bg-highlight/40 px-2.5 py-0.5 text-xs font-medium text-foreground">Subject to final policy</span>
          </h3>
          <div className="mt-4"><CheckList items={benefits} /></div>
        </div>
        <div className="surface-card rounded-3xl p-5 sm:p-6">
          <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
            <RoleIcon className="size-5 text-brand" aria-hidden="true" />
            Responsibilities
          </h3>
          <div className="mt-4"><CheckList items={responsibilities} Icon={ArrowRight} /></div>
        </div>
      </div>
    </section>
  );
}
