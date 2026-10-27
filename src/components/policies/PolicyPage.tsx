import type { ReactNode } from "react";
import Link from "next/link";
import { FileWarning } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { policyLinks } from "@/components/policies/policy-links";
import { Heading } from "@/components/ui/typography";
import { policyConfig, policyPlaceholders } from "@/config/policies";
import { siteConfig } from "@/config/site";

export interface PolicySection {
  id: string;
  title: string;
  content: ReactNode;
}

interface PolicyPageProps {
  href: (typeof policyLinks)[number]["href"];
  title: string;
  summary: ReactNode;
  sections: PolicySection[];
}

/** A detail the business has not supplied yet: highlighted so it can't be mistaken for final text. */
export function Placeholder({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-highlight/50 px-1 text-foreground">{children}</mark>;
}

/** Company contact and grievance details, shared by every policy (placeholders until supplied). */
export function ContactDetails() {
  return (
    <ul>
      <li><strong>Company:</strong> {siteConfig.legalName}, <Placeholder>{policyPlaceholders.registeredAddress}</Placeholder> (<Placeholder>{policyPlaceholders.cin}</Placeholder>)</li>
      <li><strong>Customer support:</strong> <Placeholder>{policyPlaceholders.supportEmail}</Placeholder>; <Placeholder>{policyPlaceholders.supportPhone}</Placeholder></li>
      <li><strong>Grievance Officer:</strong> <Placeholder>{policyPlaceholders.grievanceOfficer}</Placeholder></li>
    </ul>
  );
}

/** Inline link to another page, styled for running text. */
export function PolicyLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="font-medium text-primary underline underline-offset-4 hover:text-primary-hover">{children}</Link>;
}

// Shared layout for the five policy pages: title, draft notice, a contents list (sticky beside the
// text from lg), numbered sections and links to the other policies. Body text is set for reading:
// 65–75 characters a line, 1.7 line height.
export function PolicyPage({ href, title, summary, sections }: PolicyPageProps) {
  return (
    <main id="main-content" className="flex-1">
      <Container className="pt-4 pb-12 sm:pt-6 lg:pt-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
        <header className="mt-3 max-w-3xl">
          <Heading as="h1" variant="h1" className="text-[1.75rem] sm:text-4xl">{title}</Heading>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {policyConfig.lastUpdated ?? <Placeholder>Date of publication — to be added</Placeholder>}
          </p>
          <div className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">{summary}</div>
        </header>

        <div role="note" className="mt-6 flex max-w-3xl gap-3 rounded-2xl border border-warning/30 bg-card p-4 text-sm">
          <FileWarning className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <p className="leading-relaxed text-foreground/85">
            <strong className="font-semibold text-foreground">Draft for legal review.</strong> This policy reflects Mithren Agro’s intended practices
            and must be reviewed by a qualified Indian lawyer before publication. Highlighted items are details still to be added. Nothing in it
            limits rights you have under applicable law, including the Consumer Protection Act, 2019.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
          <nav aria-labelledby="contents-title" className="lg:sticky lg:top-36 lg:self-start">
            <h2 id="contents-title" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Contents</h2>
            <ol className="mt-3 space-y-0.5 border-l border-border text-sm">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="-ml-px flex min-h-9 items-center border-l-2 border-transparent pl-3 text-muted-foreground outline-none hover:border-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                    {i + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="max-w-3xl min-w-0 space-y-9">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-6 lg:scroll-mt-36">
                <h2 id={`${section.id}-title`} className="font-heading text-lg font-semibold sm:text-xl">
                  {i + 1}. {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-[0.9375rem] leading-[1.7] text-foreground/85 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                  {section.content}
                </div>
              </section>
            ))}

            <nav aria-labelledby="related-title" className="rounded-3xl bg-soft p-5 ring-1 ring-border sm:p-6">
              <h2 id="related-title" className="font-heading text-base font-semibold">Other policies</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {policyLinks.filter((link) => link.href !== href).map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-medium text-primary outline-none hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </Container>
    </main>
  );
}
