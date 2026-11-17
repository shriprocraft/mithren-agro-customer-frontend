import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeContent as Home } from "@/components/home/HomeContent";
import { AppProviders } from "@/context/AppProviders";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// The homepage reads the catalogue from the backend; here the API's answers are the test fixtures.
vi.mock("@/services/catalog", async () => {
  const { products } = await import("./fixtures/catalog/products");
  const { categories } = await import("./fixtures/catalog/categories");
  const { bundles, comboBoxes } = await import("./fixtures/catalog/bundles");
  const { vendors } = await import("./fixtures/catalog/vendors");
  return {
    getCategories: async () => categories,
    getVendors: async () => vendors,
    getProducts: async () => products,
    getBundles: async () => bundles,
    getComboBoxes: async () => comboBoxes,
  };
});

describe("homepage", () => {
  it("renders one h1 and the sections in the required order, without the removed ones", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    // Top-level sections, in page order, by the id of the heading that labels them.
    const order = ["hero-title", "about-title", "videos-title", "home-search", "categories-title", "combo-offers-title", "banner-title"];
    const sections = [...document.querySelectorAll("main > section")].map((section) => section.getAttribute("aria-labelledby") ?? section.id);
    expect(sections).toEqual(order);
    for (const removed of ["Fresh picks", "Pantry staples, sold by the pack", "Supplies for gardens and fields", "Everyday ethnic wear and easy dresses"]) {
      expect(screen.queryByRole("heading", { name: removed })).toBeNull();
    }
    expect(screen.queryByRole("region", { name: "Featured collections" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Seasonal picks" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Product categories" })).toBeNull();
  });

  it("hero is the static original: one image, Investor Opportunities and Agent Benefits, no slider", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);
    const hero = document.querySelector<HTMLElement>('section[aria-labelledby="hero-title"]')!;
    expect(hero.querySelector("#hero-title")).toHaveTextContent("Good FoodGrows a BetterTomorrow");
    expect(hero.querySelectorAll("img")).toHaveLength(1);
    expect(hero.querySelector("img")!.getAttribute("src")).toContain("mithren-hero-crate");
    expect(within(hero).getByRole("link", { name: /Investor Opportunities/ })).toHaveAttribute("href", "/investors");
    expect(within(hero).getByRole("link", { name: /Agent Benefits/ })).toHaveAttribute("href", "/agent-benefits");
    expect(hero.querySelector('[aria-roledescription="carousel"], [aria-roledescription="slide"]')).toBeNull();
    expect(within(hero).queryByRole("button", { name: /slide/i })).toBeNull();
    expect(within(hero).queryByText("Meet Our Farmers")).toBeNull();
    // The benefits strip along the bottom has no liquid glass.
    expect(hero.querySelector("ul")!.className).not.toMatch(/glass/);
  });

  it("About Mithren Agro shows three highlights and Learn More", async () => {
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
    const about = document.querySelector('section[aria-labelledby="about-title"]');
    expect(sections[sections.indexOf(about!) + 1]).toBe(videos);
  });

  it("shows each product in one section only, every card linking to its details page", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);
    // A card may link to its product twice (name and "Details"), but no product appears in two cards.
    const perCard = [...document.querySelectorAll("main article")]
      .map((card) => [...new Set([...card.querySelectorAll('a[href^="/products/"]')].map((a) => a.getAttribute("href")))])
      .filter((hrefs) => hrefs.length > 0);
    expect(perCard.length).toBeGreaterThanOrEqual(3);
    for (const hrefs of perCard) expect(hrefs).toHaveLength(1);
    const all = perCard.flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it("shows exactly the nine categories, in order, each linking to its own filtered listing", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);
    const links = within(screen.getByRole("list", { name: "Categories" })).getAllByRole("link");
    expect(links.map((a) => a.textContent?.split(",")[0]?.trim())).toEqual([
      "Spinach", "Vegetables", "Fruits", "Organic Groceries", "Oil", "Cosmetics", "Fancy Items", "Women Apparels", "Fertilizers",
    ]);
    expect(links.map((a) => a.getAttribute("href"))).toEqual(
      ["spinach", "vegetables", "fruits", "organic-groceries", "oil", "cosmetics", "fancy-items", "womens-apparel", "fertilizers"].map((s) => `/products?category=${s}`),
    );
  });

  it("shows each category once in a swipeable row, every card a link to its filter", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);
    const row = document.getElementById("categories-row")!;
    expect(row.tagName).toBe("UL");
    expect(row).toHaveAttribute("aria-label", "Categories");
    expect(row).toHaveClass("overflow-x-auto", "snap-x");
    expect(row.querySelector("[inert]")).toBeNull();
    expect([...row.children].every((card) => !card.hasAttribute("aria-hidden"))).toBe(true);
    expect(document.querySelector(".animate-marquee")).toBeNull();
    const links = within(row).getAllByRole("link");
    const hrefs = links.map((a) => a.getAttribute("href"));
    expect(new Set(hrefs).size).toBe(hrefs.length); // no category twice
    expect(hrefs).toHaveLength(9);
    expect(hrefs.every((href) => href?.startsWith("/products?category="))).toBe(true);
    expect(screen.queryByRole("button", { name: /pause|resume|play/i })).toBeNull();
  });

  it("puts the search directly above Shop by category, and the hero has no delivery card", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);
    const search = document.getElementById("home-search")!;
    expect(search.nextElementSibling?.id).toBe("categories");
    expect(within(search).getByRole("searchbox", { name: "What are you looking for today?" })).toHaveAttribute("placeholder", "Search fruits, vegetables, organic products and more…");
    expect(within(search).getByRole("button", { name: "Search" })).toHaveAttribute("type", "submit");
    const hero = document.querySelector<HTMLElement>('section[aria-labelledby="hero-title"]')!;
    expect(within(hero).queryByText("Delivery by area")).toBeNull();
    expect(within(hero).queryByRole("search")).toBeNull();
  });

  it("shows COMBO OFFERS as the ₹1,000, ₹5,000 and ₹10,000 boxes only, in one section", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);
    const offers = screen.getByRole("region", { name: "Combo Offers" });
    expect(within(offers).getByRole("heading", { level: 2 })).toHaveClass("uppercase");
    const cards = within(offers).getAllByRole("article");
    expect(cards).toHaveLength(3);
    expect(cards.slice(0, 3).map((card) => card.textContent?.match(/₹[0-9,]+/)?.[0])).toEqual(["₹1,000", "₹5,000", "₹10,000"]);
    for (const card of cards.slice(0, 3)) expect(within(card).getAllByRole("listitem").length).toBeGreaterThan(5);
    for (const card of cards) expect(within(card).getByRole("button", { name: /Add to cart/ })).toBeInTheDocument();
    expect(screen.queryByText("Smaller everyday packs")).toBeNull();
    // The separate "Combo boxes" section is gone.
    expect(screen.queryByRole("heading", { name: "Combo boxes" })).toBeNull();
    expect(document.getElementById("bundles")).toBeNull();
  });

  it("keeps investment content off the homepage, reachable through one hero link", async () => {
    render(<AppProviders>{await Home()}</AppProviders>);
    expect(screen.queryByRole("region", { name: "Investor Opportunities" })).toBeNull();
    expect(document.getElementById("investor-opportunities")).toBeNull();
    expect(document.querySelector("main")!.textContent).not.toMatch(/Contribution amounts|₹25,000|₹50,000|Explore Investment Opportunities/);
    const links = [...document.querySelectorAll("main a")].filter((a) => a.getAttribute("href")?.startsWith("/investors"));
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/investors"]);
  });
});
