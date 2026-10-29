import type { AllocationRules, InvestmentDomain, InvestmentPlan, InvestmentProject } from "@/types/investment";

// Mock data for the Investor Opportunities pages. Mithren Agro runs 12 agricultural projects, two in
// each of six domains, and offers five contribution amounts. That structure and the amounts come from
// the business; everything else that has not been confirmed is left null or labelled as a placeholder:
//
// - Project names and descriptions: "Crop Production Project 1" etc. until approved details exist.
// - Locations, status and photographs of the projects: none confirmed. Each domain has a representative
//   photograph (Unsplash License, docs/IMAGE_CREDITS.md); it illustrates the domain, not a Mithren Agro site.
// - Each plan's duration: the plan brochure lists stages of 10, 12 and 24 weeks and 3, 6 and 12 months,
//   but not legibly enough to tell which applies to which amount, so every duration is null.
// - Which plans apply to which projects, and whether a plan can be split or plans combined: null.
//
// No rate, return, payout, maturity value or guarantee exists anywhere in this data, and none may be
// added without approved documentation. The brochure's "Special Custom Plan" is excluded on request.
// To publish confirmed details, edit the records below; the pages read everything from here.

export const investmentDomains: InvestmentDomain[] = [
  { id: "dom-crop", slug: "crop-production", name: "Crop Production", summary: "Growing field crops, vegetables and fruit for market.", image: { src: "/images/investors/crop-production.jpg", alt: "Rows of leafy green vegetables growing in a cultivated field" } },
  { id: "dom-dairy", slug: "dairy-farming", name: "Dairy Farming", summary: "Rearing cattle for milk and dairy products.", image: { src: "/images/investors/dairy-farming.jpg", alt: "Dairy cattle grazing on green pasture" } },
  { id: "dom-fish", slug: "fish-farming", name: "Fish Farming", summary: "Raising fish in ponds and tanks.", image: { src: "/images/investors/fish-farming.jpg", alt: "Fish being harvested with a net at a fish farm" } },
  { id: "dom-poultry", slug: "poultry-farming", name: "Poultry Farming", summary: "Rearing poultry for eggs and meat.", image: { src: "/images/investors/poultry-farming.jpg", alt: "A flock of hens at a poultry farm shed" } },
  { id: "dom-biogas", slug: "biogas-composting", name: "Biogas & Composting", summary: "Turning farm and food waste into biogas and compost.", image: { src: "/images/investors/biogas-composting.jpg", alt: "Wooden compost bins filled with organic waste" } },
  { id: "dom-forestry", slug: "agri-forestry", name: "Agri Forestry", summary: "Growing trees alongside crops and pasture.", image: { src: "/images/investors/agri-forestry.jpg", alt: "Farmland planted among trees under a blue sky" } },
];

const PLACEHOLDER_SUMMARY =
  "Placeholder: the project's name, location, scope and timeline will be published here once Mithren Agro confirms them.";

// Two projects per domain, in domain order: crop-production-1, crop-production-2, dairy-farming-1, …
export const investmentProjects: InvestmentProject[] = investmentDomains.flatMap((domain) =>
  [1, 2].map((n) => ({
    id: `${domain.slug}-${n}`,
    domain_id: domain.id,
    name: `${domain.name} Project ${n}`,
    summary: PLACEHOLDER_SUMMARY,
    is_placeholder: true,
    location: null,
    eligible_plan_ids: null,
  })),
);

export const investmentPlans: InvestmentPlan[] = [
  { id: "plan-1000", amount: 1_000_00, duration: null },
  { id: "plan-10000", amount: 10_000_00, duration: null },
  { id: "plan-25000", amount: 25_000_00, duration: null },
  { id: "plan-50000", amount: 50_000_00, duration: null },
  { id: "plan-100000", amount: 1_00_000_00, duration: null },
];

/** The duration stages shown in the plan brochure, not yet matched to amounts. */
export const brochureDurationStages = ["10 weeks", "12 weeks", "24 weeks", "3 months", "6 months", "12 months"] as const;

export const allocationRules: AllocationRules = {
  projects_per_plan: null,
  plans_combinable: null,
};
