import { investmentDomains, investmentPlans, investmentProjects } from "@/data/investments";
import { formatPrice } from "@/lib/formatters";
import type { InvestmentDomain, InvestmentPlan, InvestmentProject } from "@/types/investment";

// Reading the Investor Opportunities data. Nothing here invents a rule: where the data says null
// (not confirmed), these helpers say "unconfirmed" and the UI labels it so.

export const PENDING = "Awaiting confirmation";

export function getDomain(id: string): InvestmentDomain | undefined {
  return investmentDomains.find((d) => d.id === id);
}

export function getProject(id: string): InvestmentProject | undefined {
  return investmentProjects.find((p) => p.id === id);
}

export function getPlan(id: string): InvestmentPlan | undefined {
  return investmentPlans.find((p) => p.id === id);
}

/** The domains in order, each with its projects. */
export function projectsByDomain(projects = investmentProjects, domains = investmentDomains) {
  return domains.map((domain) => ({ domain, projects: projects.filter((p) => p.domain_id === domain.id) }));
}

export type PlanEligibility = "eligible" | "not_eligible" | "unconfirmed";

/** Whether a project accepts a plan: only a confirmed list can say yes or no. */
export function planEligibility(project: InvestmentProject, planId: string): PlanEligibility {
  if (project.eligible_plan_ids === null) return "unconfirmed";
  return project.eligible_plan_ids.includes(planId) ? "eligible" : "not_eligible";
}

export function projectHref(project: Pick<InvestmentProject, "id">): string {
  return `/investors/projects/${project.id}`;
}

export function selectionHref(selection: { plan?: string; project?: string } = {}): string {
  const params = new URLSearchParams();
  if (selection.plan) params.set("plan", selection.plan);
  if (selection.project) params.set("project", selection.project);
  const query = params.toString();
  return `/investors/plan${query ? `?${query}` : ""}`;
}

export interface SelectionErrors {
  plan?: string;
  project?: string;
}

/** Checks a plan-and-project selection before the review step. */
export function validateSelection(planId: string | null, projectId: string | null): SelectionErrors {
  const errors: SelectionErrors = {};
  const plan = planId ? getPlan(planId) : undefined;
  const project = projectId ? getProject(projectId) : undefined;
  if (!plan) errors.plan = "Choose a contribution amount.";
  if (!project) errors.project = "Choose a project.";
  else if (plan && planEligibility(project, plan.id) === "not_eligible") {
    errors.project = `${project.name} isn’t open to the ${formatPrice(plan.amount)} plan. Choose another project or amount.`;
  }
  return errors;
}
