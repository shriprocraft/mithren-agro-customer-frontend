"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Category } from "@/types/catalog";

// The storefront's categories, loaded by the root layout from the backend catalogue, for client components
// that need a category's slug: image shapes, return eligibility.
const CatalogCategoriesContext = createContext<Category[] | null>(null);
const NONE: Category[] = [];

export function CatalogCategoriesProvider({ categories, children }: { categories: Category[]; children: ReactNode }) {
  return <CatalogCategoriesContext.Provider value={categories}>{children}</CatalogCategoriesContext.Provider>;
}

/** The layout's categories; none outside the layout or when the catalogue couldn't be loaded. */
export function useCatalogCategories(): Category[] {
  return useContext(CatalogCategoriesContext) ?? NONE;
}
