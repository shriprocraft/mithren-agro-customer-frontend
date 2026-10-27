import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { AppProviders } from "@/context/AppProviders";

describe("homepage", () => {
  it("renders one h1 and the sections in the required order, without the removed ones", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    // Top-level sections, in page order, by the id of the heading that labels them.
    const order = ["hero-title", "about-title", "videos-title", "categories-title", "seasonal-title", "bundles-title", "banner-title"];
    const sections = [...document.querySelectorAll("main > section")].map((section) => section.getAttribute("aria-labelledby"));
    expect(sections).toEqual(order);
    for (const removed of ["Fresh picks", "Pantry staples, sold by the pack", "Supplies for gardens and fields", "Everyday ethnic wear and easy dresses"]) {
      expect(screen.queryByRole("heading", { name: removed })).toBeNull();
    }
    expect(screen.queryByRole("region", { name: "Featured collections" })).toBeNull();
  });

  it("hero is the static original: one image, Investor Opportunities and Agent Benefits, no slider", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);
    const hero = document.querySelector<HTMLElement>('section[aria-labelledby="hero-title"]')!;
    expect(hero.querySelector("#hero-title")).toHaveTextContent("Good FoodGrows a BetterTomorrow");
    expect(hero.querySelectorAll("img")).toHaveLength(1);
    expect(hero.querySelector("img")!.getAttribute("src")).toContain("mithren-hero-produce");
    expect(within(hero).getByRole("link", { name: /Investor Opportunities/ })).toHaveAttribute("href", "/investors");
    expect(within(hero).getByRole("link", { name: /Agent Benefits/ })).toHaveAttribute("href", "/agent-benefits");
    expect(hero.querySelector('[aria-roledescription="carousel"], [aria-roledescription="slide"]')).toBeNull();
    expect(within(hero).queryByRole("button", { name: /slide/i })).toBeNull();
    expect(within(hero).queryByText("Meet Our Farmers")).toBeNull();
    // The benefits strip along the bottom has no liquid glass.
    expect(hero.querySelector("ul")!.className).not.toMatch(/glass/);
  });

  it("About Mithren Agro follows the hero with three highlights and Learn More", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);
    const about = document.querySelector<HTMLElement>('section[aria-labelledby="about-title"]')!;
    expect(within(about).getByRole("heading", { name: "About Mithren Agro" })).toBeInTheDocument();
    expect(within(about).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Farm FreshProduce", "One PlaceExplore Products", "Grow TogetherJoin Our Community"]);
    expect(within(about).getByRole("link", { name: /Learn More/ })).toHaveAttribute("href", "/about");
    expect(about.textContent).not.toMatch(/[0-9]/); // highlights, not invented statistics
  });

  it("shows two video cards right after About, with no source configured", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);
    const videos = screen.getByRole("region", { name: "Videos about Mithren Agro" });
    expect(within(videos).getAllByRole("article")).toHaveLength(2);
    expect(within(videos).getAllByText("Video coming soon")).toHaveLength(2);
    expect(within(videos).queryByRole("button", { name: /Play video/ })).toBeNull();
    const sections = [...document.querySelectorAll("main > section")];
    expect(sections[2]).toBe(videos);
  });

  it("shows each product in one section only, every card linking to its details page", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);
    const hrefs = [...document.querySelectorAll('main a[href^="/products/"]')].map((a) => a.getAttribute("href"));
    expect(hrefs.length).toBeGreaterThan(5);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("links to all five categories from the category grid", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);
    for (const slug of ["fruits", "vegetables", "organic-groceries", "fertilizers", "womens-apparel"]) {
      expect(document.querySelector(`#categories a[href="/products?category=${slug}"]`)).not.toBeNull();
    }
  });
});
