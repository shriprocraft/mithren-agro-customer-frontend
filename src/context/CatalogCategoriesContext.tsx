"use client";

import { createContext, useContext, type ReactNode } from "react";
import { categories as sampleCategories } from "@/data/categories";
import type { Category } from "@/types/catalog";

// The storefront's categories, loaded once by the root layout from the catalogue service (backend or
// sample data), for client components that need a category's slug: image shapes, return eligibility.
const CatalogCategoriesContext = createContext<Category[] | null>(null);

export function CatalogCategoriesProvider({ categories, children }: { categories: Category[]; children: ReactNode }) {
  return <CatalogCategoriesContext.Provider value={categories}>{children}</CatalogCategoriesContext.Provider>;
}

/** The layout's categories. Outside the layout (a component rendered on its own), the sample categories. */
export function useCatalogCategories(): Category[] {
  return useContext(CatalogCategoriesContext) ?? sampleCategories;
}
