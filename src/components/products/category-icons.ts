import { Apple, Carrot, Droplet, Gem, Leaf, Shirt, Sparkles, Sprout, Wheat, type LucideIcon } from "lucide-react";
import type { CategorySlug } from "@/types/catalog";

// One icon per category, shared by navigation and category cards. No emoji (scope §2.1).
export const categoryIcons: Record<CategorySlug, LucideIcon> = {
  spinach: Leaf,
  vegetables: Carrot,
  fruits: Apple,
  "organic-groceries": Wheat,
  oil: Droplet,
  cosmetics: Sparkles,
  "fancy-items": Gem,
  "womens-apparel": Shirt,
  fertilizers: Sprout,
};
