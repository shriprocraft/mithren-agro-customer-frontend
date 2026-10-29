// Investor Opportunities models. Like the catalogue, fields are snake_case so they can map to an API
// response later. Anything Mithren Agro has not confirmed is null, never a guessed value: the UI shows
// "awaiting confirmation" for it (data/investments.ts).

import type { ImageAsset } from "@/types/catalog";

export const investmentDomainSlugs = [
  "crop-production",
  "dairy-farming",
  "fish-farming",
  "poultry-farming",
  "biogas-composting",
  "agri-forestry",
] as const;

export type InvestmentDomainSlug = (typeof investmentDomainSlugs)[number];

export interface InvestmentDomain {
  id: string;
  slug: InvestmentDomainSlug;
  name: string;
  /** What the domain covers in general terms; not a description of a specific project. */
  summary: string;
  /** Optional photograph. Without one the UI shows the domain's icon panel. */
  image?: ImageAsset;
}

export interface InvestmentProject {
  id: string;
  domain_id: string;
  name: string;
  summary: string;
  /** True while the name and summary are labelled placeholders awaiting approved project details. */
  is_placeholder: boolean;
  /** Confirmed location, or null. */
  location: string | null;
  image?: ImageAsset;
  /**
   * The plans this project accepts, or null while that has not been confirmed. An empty array means
   * the project is confirmed as not open to any plan.
   */
  eligible_plan_ids: string[] | null;
}

export interface InvestmentPlan {
  id: string;
  /** Contribution amount in paise, like every other amount in the app. */
  amount: number;
  /** Confirmed duration for this amount (such as "12 weeks"), or null. */
  duration: string | null;
}

/** How plans may be allocated to projects. null: not confirmed by Mithren Agro yet. */
export interface AllocationRules {
  /** Whether one plan can fund a single project or be split across several. */
  projects_per_plan: "one" | "several" | null;
  /** Whether an investor can combine more than one plan. */
  plans_combinable: boolean | null;
}
