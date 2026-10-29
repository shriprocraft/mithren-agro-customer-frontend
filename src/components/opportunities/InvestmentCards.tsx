import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin } from "lucide-react";
import { domainIcons } from "@/components/opportunities/investment-icons";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/formatters";
import { PENDING, projectHref, selectionHref } from "@/lib/investments";
import { cn } from "@/lib/utils";
import type { InvestmentDomain, InvestmentPlan, InvestmentProject } from "@/types/investment";

// Cards shared by the homepage section and the Investor Opportunities pages. Every value comes from
// data/investments.ts; unconfirmed values read "Awaiting confirmation" and placeholders say so.

/**
 * The domain's (or project's) photograph, with the domain icon as a small badge in the corner; without
 * a photograph, the icon on a soft green panel.
 */
export function DomainVisual({ domain, image, className, sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" }: {
  domain: InvestmentDomain;
  image?: InvestmentDomain["image"];
  className?: string;
  sizes?: string;
}) {
  const Icon = domainIcons[domain.slug];
  const photo = image ?? domain.image;
  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {photo ? (
        <>
          <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="object-cover" />
          <span aria-hidden="true" className="absolute top-2 left-2 grid size-8 place-items-center rounded-full bg-card/90 text-primary shadow-[0_4px_12px_-6px_rgb(var(--shadow-tint)/0.5)]">
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-linear-to-br from-secondary via-soft to-card" aria-hidden="true">
          <span className="absolute -right-6 -bottom-8 text-primary/7">
            <Icon className="size-36" strokeWidth={1.25} />
          </span>
          <span className="grid size-16 place-items-center rounded-full bg-card text-primary shadow-[0_10px_24px_-14px_rgb(var(--shadow-tint)/0.55)] ring-1 ring-border">
            <Icon className="size-8" strokeWidth={1.5} />
          </span>
        </div>
      )}
    </div>
  );
}

export function PlaceholderBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-highlight/40 px-2.5 py-0.5 text-[0.6875rem] font-medium text-foreground", className)}>
      Placeholder · details to be confirmed
    </span>
  );
}

/** A domain with its two projects listed by name. */
export function DomainCard({ domain, projects, headingLevel = "h3" }: { domain: InvestmentDomain; projects: InvestmentProject[]; headingLevel?: "h2" | "h3" }) {
  const Title = headingLevel;
  return (
    <article className="surface-card flex h-full flex-col rounded-3xl p-3 sm:p-4">
      <DomainVisual domain={domain} className="aspect-[16/9]" />
      <div className="flex flex-1 flex-col px-1 pt-3 sm:px-1.5">
        <div className="flex items-start justify-between gap-3">
          <Title className="font-heading text-base leading-snug font-semibold">{domain.name}</Title>
          <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{domain.summary}</p>
        <ul className="mt-3 grid gap-1 border-t border-border pt-3 text-sm">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={projectHref(project)}
                className="flex min-h-9 items-center justify-between gap-2 rounded-lg px-1 font-medium text-foreground/85 outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-ring"
              >
                {project.name}
                <ArrowRight className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={`/investors/projects#${domain.slug}`}
          className="mt-auto inline-flex min-h-10 items-center gap-1.5 self-start rounded-full pt-2 text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          View projects<span className="sr-only"> in {domain.name}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

/** A contribution amount; the duration reads "Awaiting confirmation" until one is confirmed. */
export function PlanCard({ plan, headingLevel = "h3" }: { plan: InvestmentPlan; headingLevel?: "h2" | "h3" }) {
  const Title = headingLevel;
  const amount = formatPrice(plan.amount);
  return (
    <article className="surface-card flex h-full flex-col rounded-3xl p-5">
      <p className="text-xs font-semibold tracking-wide text-brand uppercase">Contribution</p>
      <Title className="mt-1 font-heading text-[1.75rem] leading-none font-semibold tracking-tight text-foreground">{amount}</Title>
      <dl className="mt-4 grid gap-2 border-t border-border pt-4 text-sm">
        <div className="flex items-start gap-2">
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <dt className="text-xs text-muted-foreground">Duration</dt>
            <dd className={cn("font-medium", !plan.duration && "text-foreground/70")}>{plan.duration ?? PENDING}</dd>
          </div>
        </div>
      </dl>
      <Button asChild variant="outline" className="mt-5 w-full">
        <Link href={selectionHref({ plan: plan.id })}>
          Choose {amount}
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </article>
  );
}

/** One of the 12 projects. */
export function ProjectCard({ project, domain, headingLevel = "h3" }: { project: InvestmentProject; domain: InvestmentDomain; headingLevel?: "h2" | "h3" | "h4" }) {
  const Title = headingLevel;
  return (
    <article className="surface-card flex h-full flex-col rounded-3xl p-3 sm:p-4">
      <DomainVisual domain={domain} image={project.image} className="aspect-[16/9]" />
      <div className="flex flex-1 flex-col px-1 pt-3 sm:px-1.5">
        <p className="text-xs font-semibold tracking-wide text-brand uppercase">{domain.name}</p>
        <Title className="mt-0.5 font-heading text-base leading-snug font-semibold">{project.name}</Title>
        {project.is_placeholder && <PlaceholderBadge className="mt-2 self-start" />}
        <p className="mt-2 text-sm text-muted-foreground">{project.summary}</p>
        <dl className="mt-3 grid gap-1.5 border-t border-border pt-3 text-xs">
          <div className="flex gap-1.5">
            <MapPin className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
            <dt className="text-muted-foreground">Location:</dt>
            <dd className="font-medium text-foreground/80">{project.location ?? PENDING}</dd>
          </div>
          <div className="flex gap-1.5">
            <CalendarClock className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
            <dt className="text-muted-foreground">Eligible plans:</dt>
            <dd className="font-medium text-foreground/80">
              {project.eligible_plan_ids === null
                ? PENDING
                : project.eligible_plan_ids.length === 0
                  ? "Not open to any plan"
                  : `${project.eligible_plan_ids.length} confirmed`}
            </dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Button asChild variant="outline" className="h-10 flex-1 px-4">
            <Link href={projectHref(project)}>
              View details<span className="sr-only"> of {project.name}</span>
            </Link>
          </Button>
          <Button asChild className="h-10 flex-1 px-4">
            <Link href={selectionHref({ project: project.id })}>
              Select<span className="sr-only"> {project.name}</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
