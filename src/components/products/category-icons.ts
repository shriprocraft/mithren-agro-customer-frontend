import { Apple, Carrot, Shirt, Sprout, Wheat, type LucideIcon } from "lucide-react";
import type { CategorySlug } from "@/types/catalog";

// One icon per category, shared by navigation and category cards. No emoji (scope §2.1).
export const categoryIcons: Record<CategorySlug, LucideIcon> = {
  fruits: Apple,
  vegetables: Carrot,
  "organic-groceries": Wheat,
  fertilizers: Sprout,
  "womens-apparel": Shirt,
};
