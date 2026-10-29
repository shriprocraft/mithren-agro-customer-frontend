import { Egg, Fish, Milk, Recycle, Trees, Wheat, type LucideIcon } from "lucide-react";
import type { InvestmentDomainSlug } from "@/types/investment";

// One icon per agricultural domain, shared by every Investor Opportunities card.
export const domainIcons: Record<InvestmentDomainSlug, LucideIcon> = {
  "crop-production": Wheat,
  "dairy-farming": Milk,
  "fish-farming": Fish,
  "poultry-farming": Egg,
  "biogas-composting": Recycle,
  "agri-forestry": Trees,
};
