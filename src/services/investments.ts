import { allocationRules, investmentDomains, investmentPlans, investmentProjects } from "@/data/investments";
import type { AllocationRules, InvestmentDomain, InvestmentPlan, InvestmentProject } from "@/types/investment";

// The layer pages call for Investor Opportunities data, like services/catalog.ts: async so call sites
// stay the same when it is read from an API instead of the mock data in data/investments.ts.

export async function getInvestmentDomains(): Promise<InvestmentDomain[]> {
  return investmentDomains;
}

export async function getInvestmentProjects(): Promise<InvestmentProject[]> {
  return investmentProjects;
}

export async function getInvestmentProject(id: string): Promise<InvestmentProject | undefined> {
  return investmentProjects.find((p) => p.id === id);
}

export async function getInvestmentPlans(): Promise<InvestmentPlan[]> {
  return investmentPlans;
}

export async function getAllocationRules(): Promise<AllocationRules> {
  return allocationRules;
}
