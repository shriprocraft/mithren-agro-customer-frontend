import type { ReactNode } from "react";
import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/typography";

interface OpportunityHeroProps {
  breadcrumb: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
  image: { src: string; alt: string };
}

// Hero for the Agent Benefits and Investor Opportunities pages: copy and actions on the left, a
// photograph on a rounded panel on the right (below the copy on phones).
export function OpportunityHero({ breadcrumb, eyebrow, title, children, actions, image }: OpportunityHeroProps) {
  return (
    <section aria-labelledby="page-title" className="bg-soft">
      <Container className="pt-4 pb-8 sm:pt-6 sm:pb-10 lg:pb-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: breadcrumb }]} />
        <div className="mt-4 grid items-center gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:mt-6 lg:gap-12">
          <div>
            <p className="text-xs font-semibold tracking-wide text-brand uppercase">{eyebrow}</p>
            <Heading as="h1" id="page-title" variant="h1" className="mt-2 text-[1.875rem] text-balance sm:text-4xl lg:text-5xl">
              {title}
            </Heading>
            <div className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-pretty text-foreground/80 sm:text-base">{children}</div>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">{actions}</div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-[var(--elevation-card)] ring-1 ring-border">
            <Image src={image.src} alt={image.alt} fill priority sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
          </div>
        </div>
      </Container>
    </section>
  );
}
