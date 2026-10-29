import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { DomainVisual, PlaceholderBadge } from "@/components/opportunities/InvestmentCards";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { formatPrice } from "@/lib/formatters";
import { getDomain, PENDING, planEligibility, projectHref, selectionHref } from "@/lib/investments";
import { getInvestmentPlans, getInvestmentProject, getInvestmentProjects } from "@/services/investments";

// Every project is prerendered; other ids render at request time and call notFound() (same pattern
// as the product page: params are awaited inside Suspense).
export async function generateStaticParams() {
  return (await getInvestmentProjects()).map((p) => ({ projectId: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/investors/projects/[projectId]">): Promise<Metadata> {
  const project = await getInvestmentProject((await params).projectId);
  return { title: project ? project.name : "Project not found" };
}

export default function InvestmentProjectPage({ params }: PageProps<"/investors/projects/[projectId]">) {
  return (
    <main id="main-content" className="flex-1">
      <Container className="min-h-[70svh] pt-4 pb-10 sm:pt-6 lg:pt-8">
        <Suspense fallback={<div className="h-[60svh] animate-pulse rounded-3xl bg-muted motion-reduce:animate-none" aria-label="Loading project" />}>
          <ProjectContent params={params} />
        </Suspense>
      </Container>
    </main>
  );
}

async function ProjectContent({ params }: Pick<PageProps<"/investors/projects/[projectId]">, "params">) {
  const { projectId } = await params;
  const project = await getInvestmentProject(projectId);
  const domain = project && getDomain(project.domain_id);
  if (!project || !domain) notFound();

  const [plans, projects] = await Promise.all([getInvestmentPlans(), getInvestmentProjects()]);
  const sibling = projects.find((p) => p.domain_id === domain.id && p.id !== project.id);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Investor Opportunities", href: "/investors" },
          { label: "Projects", href: `/investors/projects#${domain.slug}` },
          { label: project.name },
        ]}
      />
      <div className="mt-4 grid gap-6 md:grid-cols-2 md:gap-10 lg:mt-6 [&>*]:min-w-0">
        <DomainVisual domain={domain} image={project.image} className="aspect-[4/3] md:sticky md:top-36" sizes="(min-width: 768px) 45vw, 100vw" />
        <div>
          <p className="text-xs font-semibold tracking-wide text-brand uppercase">{domain.name}</p>
          <Heading as="h1" variant="h1" className="mt-1.5 text-balance">{project.name}</Heading>
          {project.is_placeholder && <PlaceholderBadge className="mt-3" />}
          <p className="mt-4 leading-relaxed text-foreground/80">{project.summary}</p>

          <dl className="mt-6 grid gap-3 rounded-3xl border border-border bg-card p-5 text-sm">
            {[
              ["Domain", domain.name],
              ["About the domain", domain.summary],
              ["Location", project.location ?? PENDING],
              ["Eligible plans", project.eligible_plan_ids === null ? PENDING : `${project.eligible_plan_ids.length} confirmed`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 border-b border-dashed border-border pb-3 last:border-0 last:pb-0">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-8 font-heading text-lg font-semibold">Contribution amounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Which of these apply to this project, and for how long, is awaiting confirmation.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {plans.map((plan) => {
              const status = planEligibility(project, plan.id);
              if (status === "not_eligible") return null;
              return (
                <li key={plan.id}>
                  <Link
                    href={selectionHref({ plan: plan.id, project: project.id })}
                    className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 font-heading text-[0.9375rem] font-semibold outline-none hover:border-primary/40 hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {formatPrice(plan.amount)}
                    <span className="sr-only"> with {project.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg">
              <Link href={selectionHref({ project: project.id })}>Select this project<ArrowRight aria-hidden="true" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/investors/projects#${domain.slug}`}><ArrowLeft aria-hidden="true" />All projects</Link>
            </Button>
          </div>
          {sibling && (
            <p className="mt-6 text-sm text-muted-foreground">
              Also in {domain.name}:{" "}
              <Link href={projectHref(sibling)} className="font-medium text-primary underline-offset-4 hover:underline">{sibling.name}</Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
