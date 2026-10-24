import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { AppProviders } from "@/context/AppProviders";

describe("homepage", () => {
  it("renders one h1 and every required section", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    for (const name of [
      "Shop by category",
      "Fresh picks",
      "Seasonal picks",
      "Shop the marketplace",
      "Pantry staples, sold by the pack",
      "Supplies for gardens and fields",
      "Everyday ethnic wear and easy dresses",
      "Combo boxes",
      "For the kitchen, the garden and the wardrobe",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
  });

  it("links to all five categories from the category grid", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);
    for (const slug of ["fruits", "vegetables", "organic-groceries", "fertilizers", "womens-apparel"]) {
      expect(document.querySelector(`#categories a[href="#shop-${slug}"]`)).not.toBeNull();
    }
  });
});
