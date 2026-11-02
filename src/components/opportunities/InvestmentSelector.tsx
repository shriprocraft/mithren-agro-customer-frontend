"use client";

import { useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CircleAlert, Info, Pencil } from "lucide-react";
import { domainIcons } from "@/components/opportunities/investment-icons";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useToast } from "@/context/ToastContext";
import { formatPrice } from "@/lib/formatters";
import {
  AWAITING_CONFIRMATION,
  PENDING,
  planEligibility,
  projectsByDomain,
  RETURNS_DISCLAIMER,
  selectionHref,
  validateSelection,
  type SelectionErrors,
} from "@/lib/investments";
import { cn } from "@/lib/utils";
import type { AllocationRules, InvestmentDomain, InvestmentPlan, InvestmentProject } from "@/types/investment";

interface InvestmentSelectorProps {
  domains: InvestmentDomain[];
  projects: InvestmentProject[];
  plans: InvestmentPlan[];
  rules: AllocationRules;
}

// NOT ROUTED: investing isn't available, so no page renders this (docs/ARCHITECTURE.md). Choose a
// contribution amount and, if the customer wishes, one project, then review. ?plan= and ?project=
// preselect and stay in step with the choice. Nothing is submitted and nothing leaves this app. At most
// one project, because whether a plan can be split or combined has not been confirmed (AllocationRules).
export function InvestmentSelector({ domains, projects, plans, rules }: InvestmentSelectorProps) {
  const params = useSearchParams();
  const initialPlan = plans.some((p) => p.id === params.get("plan")) ? params.get("plan") : null;
  const initialProject = projects.some((p) => p.id === params.get("project")) ? params.get("project") : null;
  const [planId, setPlanId] = useState<string | null>(initialPlan);
  const [projectId, setProjectId] = useState<string | null>(initialProject);
  const [errors, setErrors] = useState<SelectionErrors>({});
  const [reviewing, setReviewing] = useState(false);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const announce = useAnnounce();

  const plan = plans.find((p) => p.id === planId);
  const project = projects.find((p) => p.id === projectId);
  const domain = project && domains.find((d) => d.id === project.domain_id);
  const groups = projectsByDomain(projects, domains);

  const syncUrl = (next: { plan: string | null; project: string | null }) => {
    window.history.replaceState(window.history.state, "", selectionHref({ plan: next.plan ?? undefined, project: next.project ?? undefined }));
  };

  const choosePlan = (id: string) => {
    setPlanId(id);
    setReviewing(false);
    setErrors((e) => ({ ...e, plan: undefined }));
    syncUrl({ plan: id, project: projectId });
  };

  const chooseProject = (id: string | null) => {
    setProjectId(id);
    setReviewing(false);
    setErrors((e) => ({ ...e, project: undefined }));
    syncUrl({ plan: planId, project: id });
  };

  const review = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateSelection(planId, projectId);
    setErrors(found);
    if (found.plan || found.project) {
      toast.error("Check your selection", { id: "investment-selection", description: [found.plan, found.project].filter(Boolean).join(" ") });
      const first = found.plan ? "plan" : "project";
      formRef.current?.querySelector<HTMLInputElement>(`input[name="${first}"]`)?.focus();
      return;
    }
    setReviewing(true);
    // Same id: replaces an earlier "isn't complete" error instead of leaving it on screen.
    toast.info("Ready to review", { id: "investment-selection", description: "Nothing has been submitted or paid." });
    announce("Review your selection below.");
    requestAnimationFrame(() => {
      reviewRef.current?.focus();
      reviewRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  };

  const edit = () => {
    setReviewing(false);
    formRef.current?.querySelector<HTMLInputElement>('input[name="plan"]:checked, input[name="plan"]')?.focus();
  };

  const eligibility = plan && project ? planEligibility(project, plan.id) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8">
      <form ref={formRef} onSubmit={review} noValidate aria-label="Choose a contribution amount" className="grid gap-6">
        <fieldset aria-describedby={errors.plan ? "plan-error" : "plan-hint"} className="surface-card rounded-3xl p-4 sm:p-6">
          <legend className="sr-only">Step 1: contribution amount</legend>
          <StepTitle step={1} title="Contribution amount" />
          <p id="plan-hint" className="mt-1 text-sm text-muted-foreground">Choosing an amount tells us how much you’re interested in contributing. It isn’t a payment or a commitment. Durations are awaiting confirmation.</p>
          <div role="radiogroup" aria-label="Contribution amount" className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
            {plans.map((p) => (
              <label
                key={p.id}
                className={cn(
                  "relative flex min-h-20 cursor-pointer flex-col justify-center rounded-2xl border bg-card px-4 py-3 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2",
                  planId === p.id ? "border-primary bg-soft ring-1 ring-primary" : "border-border hover:border-primary/40 hover:bg-soft",
                )}
              >
                <input type="radio" name="plan" value={p.id} checked={planId === p.id} onChange={() => choosePlan(p.id)} className="sr-only" />
                <span className="font-heading text-lg font-semibold text-foreground">{formatPrice(p.amount)}</span>
                <span className="text-xs text-muted-foreground">{p.duration ?? "Duration to be confirmed"}</span>
              </label>
            ))}
          </div>
          <FieldError id="plan-error" message={errors.plan} />
        </fieldset>

        <fieldset aria-describedby={errors.project ? "project-error" : "project-hint"} className="surface-card rounded-3xl p-4 sm:p-6">
          <legend className="sr-only">Step 2: project (optional)</legend>
          <StepTitle step={2} title="Project (optional)" />
          <p id="project-hint" className="mt-1 text-sm text-muted-foreground">
            {projects.length} projects in {domains.length} domains, if you already have one in mind. Project names are placeholders until Mithren Agro publishes approved details.
          </p>
          {project && (
            <Button type="button" variant="ghost" onClick={() => chooseProject(null)} className="mt-1 -ml-2 h-9 px-2 text-xs">Clear project</Button>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {groups.map(({ domain: d, projects: list }) => {
              const Icon = domainIcons[d.slug];
              return (
                <div key={d.id} role="radiogroup" aria-label={d.name}>
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span className="grid size-7 place-items-center rounded-full bg-secondary text-brand">
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>
                    {d.name}
                  </p>
                  <div className="mt-2 grid gap-2">
                    {list.map((p) => (
                      <label
                        key={p.id}
                        className={cn(
                          "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border bg-card px-3.5 py-2.5 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2",
                          projectId === p.id ? "border-primary bg-soft ring-1 ring-primary" : "border-border hover:border-primary/40 hover:bg-soft",
                        )}
                      >
                        <input type="radio" name="project" value={p.id} checked={projectId === p.id} onChange={() => chooseProject(p.id)} className="size-4 shrink-0 accent-primary" />
                        <span className="font-medium">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <FieldError id="project-error" message={errors.project} />
        </fieldset>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">Continuing doesn’t submit anything or take any payment.</p>
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            Continue
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </form>

      <aside aria-labelledby="selection-summary-title" className="lg:sticky lg:top-36">
        <div className={cn("surface-card rounded-3xl p-5 sm:p-6", reviewing && "ring-2 ring-primary")}>
          <h2 id="selection-summary-title" ref={reviewRef} tabIndex={-1} className="font-heading text-lg font-semibold outline-none">
            {reviewing ? "Review your selection" : "Your selection"}
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <SummaryRow label="Contribution amount" value={plan ? formatPrice(plan.amount) : "Not chosen yet"} muted={!plan} />
            <SummaryRow label="Duration" value={plan ? (plan.duration ?? PENDING) : "—"} muted={!plan?.duration} />
            <SummaryRow label="Project" value={project ? project.name : "None chosen (optional)"} muted={!project} />
            <SummaryRow label="Domain" value={domain ? domain.name : "—"} muted={!domain} />
            <SummaryRow label="Location" value={project ? (project.location ?? PENDING) : "—"} muted={!project?.location} />
            <SummaryRow
              label="Plan eligibility for this project"
              value={eligibility === "eligible" ? "Confirmed" : eligibility === "not_eligible" ? "Not available" : eligibility ? PENDING : "—"}
              muted={eligibility !== "eligible"}
            />
            <SummaryRow
              label="Projects per plan"
              value={rules.projects_per_plan === "one" ? "One project" : rules.projects_per_plan === "several" ? "Can be split across projects" : PENDING}
              muted={rules.projects_per_plan === null}
            />
          </dl>

          {reviewing ? (
            <div className="mt-5 grid gap-3">
              <p role="note" className="flex gap-2 rounded-2xl border border-highlight bg-highlight/25 p-3 text-xs leading-relaxed text-foreground/85">
                <Info className="mt-px size-3.5 shrink-0 text-warning" aria-hidden="true" />
                <span>
                  Preview only. Nothing has been submitted, no payment has been taken and no investment has been made. Still awaiting
                  confirmation: {AWAITING_CONFIRMATION.join(", ").toLowerCase()}. {RETURNS_DISCLAIMER}
                </span>
              </p>
              <Button type="button" variant="outline" onClick={edit} className="w-full">
                <Pencil aria-hidden="true" />
                Change selection
              </Button>
            </div>
          ) : (
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{plan ? "You can change your amount at any time. Press Continue when you’re ready." : "Choose an amount to continue. You can change it at any time."}</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function StepTitle({ step, title }: { step: number; title: string }) {
  return (
    <p aria-hidden="true" className="flex items-center gap-2.5 font-heading text-base font-semibold sm:text-lg">
      <span className="grid size-8 place-items-center rounded-full bg-primary text-sm text-primary-foreground">{step}</span>
      {title}
    </p>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-destructive">
      <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right font-medium", muted ? "text-foreground/60" : "text-foreground")}>{value}</dd>
    </div>
  );
}
