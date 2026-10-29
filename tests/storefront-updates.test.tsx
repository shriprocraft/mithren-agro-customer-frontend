import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrdersList } from "@/components/account/OrdersList";
import { RegisterView } from "@/components/account/RegisterView";
import { VideoCard } from "@/components/home/VideoCard";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { Marketplace } from "@/components/marketplace/Marketplace";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { PurchasePanel } from "@/components/products/PurchasePanel";
import { designTokens } from "@/config/design-tokens";
import { safeExternalUrl, safeMediaUrl, type HomeVideo } from "@/config/external-links";
import { AppProviders } from "@/context/AppProviders";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { vendors } from "@/data/vendors";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: push, back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/products",
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  push.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

const product = products.find((p) => p.stock_status !== "out_of_stock")!;
const vendorNames = Object.fromEntries(vendors.map((v) => [v.id, v.name]));

describe("external link configuration", () => {
  it("accepts only https URLs (http for localhost) and same-site media paths", () => {
    expect(safeExternalUrl("https://investors.example.com/login")).toBe("https://investors.example.com/login");
    expect(safeExternalUrl("http://localhost:3001")).toBe("http://localhost:3001/");
    expect(safeExternalUrl("http://investors.example.com")).toBeNull();
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("//evil.example")).toBeNull();
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl(undefined)).toBeNull();
    expect(safeMediaUrl("/videos/intro.mp4")).toBe("/videos/intro.mp4");
    expect(safeMediaUrl("//evil.example/x.mp4")).toBeNull();
    expect(safeMediaUrl("data:video/mp4;base64,AAAA")).toBeNull();
  });
});

describe("Investor Opportunities page", () => {
  it("shows a safe unavailable state when the Investor Portal URL is not configured", async () => {
    vi.resetModules();
    const { default: Page } = await import("@/app/investors/page");
    render(await Page());
    expect(screen.getByRole("heading", { level: 1, name: "Investor Opportunities" })).toBeInTheDocument();
    const unavailable = screen.getAllByRole("button", { name: /Investor Portal: coming soon/ });
    expect(unavailable).toHaveLength(1);
    unavailable.forEach((button) => expect(button).toBeDisabled());
    expect(screen.queryByRole("link", { name: /Access Investor Portal/ })).toBeNull();
    expect(screen.getByRole("heading", { name: "Risks and disclosures" })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/guaranteed returns|risk-free/i);
  });

  it("links to the configured Investor Portal", async () => {
    vi.stubEnv("NEXT_PUBLIC_INVESTOR_PORTAL_URL", "https://portal.example.com/");
    vi.resetModules();
    const { default: Page } = await import("@/app/investors/page");
    render(await Page());
    const links = screen.getAllByRole("link", { name: /Access Investor Portal/ });
    expect(links).toHaveLength(1);
    links.forEach((link) => expect(link).toHaveAttribute("href", "https://portal.example.com/"));
    const first = links[0]!;
    act(() => { first.addEventListener("click", (e) => e.preventDefault()); fireEvent.click(first); });
    expect(first).toHaveTextContent("Opening…");
  });
});

describe("Agent Benefits page", () => {
  it("presents both agent roles as proposals with disabled applications", async () => {
    vi.resetModules();
    const { default: Page } = await import("@/app/agent-benefits/page");
    render(<Page />);
    expect(screen.getByRole("heading", { level: 2, name: "Seller Agent" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Delivery Agent" })).toBeInTheDocument();
    expect(screen.getByText("Proposed benefits — subject to final company policy")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore Seller Opportunities/ })).toHaveAttribute("href", "#seller-agent");
    expect(screen.getByRole("link", { name: /Explore Delivery Opportunities/ })).toHaveAttribute("href", "#delivery-agent");
    for (const name of [/Seller Agent applications: coming soon/, /Delivery Agent applications: coming soon/]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }
    expect(screen.getByRole("heading", { name: "Become a Mithren Agent" })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/guaranteed (income|earnings|salary)|fixed salary/i);
  });
});

describe("video cards", () => {
  const base: HomeVideo = { id: "t", title: "From Farm to Your Home", description: "d", src: null, poster: { src: "/images/home/hero-produce.jpg", alt: "Basket" } };

  it("says coming soon and offers no play button without a source", () => {
    render(<VideoCard video={base} />);
    expect(screen.getByText("Video coming soon")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("video")).toBeNull();
  });

  it("plays only on request, never preloads, and reports a failed source", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    render(<VideoCard video={{ ...base, src: "/videos/intro.mp4" }} />);
    const video = document.querySelector("video")!;
    expect(video).toHaveAttribute("preload", "none");
    expect(video.autoplay).toBe(false);
    expect(play).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Play video: From Farm to Your Home" })));
    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Loading video…")).toBeInTheDocument();
    act(() => fireEvent.playing(video));
    expect(video).toHaveAttribute("controls");
    act(() => fireEvent.error(video));
    expect(screen.getByRole("alert")).toHaveTextContent("This video couldn’t be loaded");
    play.mockRestore();
  });
});

describe("add to cart feedback", () => {
  it("shows one success toast per product after the item is in the cart, then dismisses it", () => {
    vi.useFakeTimers();
    render(<AppProviders><AddToCartButton productId={product.id} productName={product.name} stockStatus={product.stock_status} /></AppProviders>);
    const button = screen.getByRole("button", { name: /Add to cart/ });
    act(() => fireEvent.click(button));
    act(() => fireEvent.click(button));
    const toasts = screen.getAllByText("Added to cart successfully!");
    expect(toasts).toHaveLength(1);
    expect(toasts[0]!.closest("[role=status]")).toHaveTextContent(`${product.name} is now in your cart.`);
    expect(JSON.parse(localStorage.getItem("mithren.cart")!)).toEqual([{ product_id: product.id, quantity: 2 }]);
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByText("Added to cart successfully!")).toBeNull();
  });

  it("shows an error toast, not a success, when the cart refuses the item", () => {
    localStorage.setItem("mithren.cart", JSON.stringify([{ product_id: product.id, quantity: MAX_QUANTITY_PER_ITEM }]));
    render(<AppProviders><AddToCartButton productId={product.id} productName={product.name} stockStatus={product.stock_status} /></AppProviders>);
    act(() => fireEvent.click(screen.getByRole("button", { name: /Add to cart/ })));
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t add to cart");
    expect(screen.queryByText("Added to cart successfully!")).toBeNull();
  });
});

describe("Buy now", () => {
  it("uses the logo-gold variant and stays a separate action from Add to cart", () => {
    render(<AppProviders><PurchasePanel product={product} /></AppProviders>);
    const buy = screen.getByRole("button", { name: "Buy now" });
    expect(buy).toHaveAttribute("data-variant", "buy");
    expect(buy.className).toContain("bg-gold");
    expect(buy.className).toContain("text-foreground");
    act(() => fireEvent.click(buy));
    expect(push).toHaveBeenCalledWith("/checkout/address");
    expect(localStorage.getItem("mithren.cart")).toBeNull(); // the cart is untouched
  });

  it("logo gold keeps strong contrast with its dark text", () => {
    const luminance = (hex: string) => {
      const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (a: string, b: string) => {
      const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    for (const fill of [designTokens.colors.gold, designTokens.colors.goldHover, designTokens.colors.goldActive]) {
      expect(contrast(fill, designTokens.colors.textPrimary)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("forms and account menu", () => {
  it("registration fields keep visible labels and gain placeholders", () => {
    render(<AppProviders><RegisterView /></AppProviders>);
    expect(screen.getByLabelText("Full name")).toHaveAttribute("placeholder", "Enter your full name");
    expect(screen.getByLabelText("Email address")).toHaveAttribute("placeholder", "Enter your email address");
    expect(screen.getByLabelText("Email address")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(/Mobile number/)).toHaveAttribute("placeholder", "Enter your 10-digit mobile number");
    expect(document.querySelector("input[type=password]")).toBeNull();
  });

  it("signed-out account menu says My Orders and opens the order history", () => {
    render(<AppProviders><AccountMenu /></AppProviders>);
    act(() => fireEvent.click(screen.getByRole("button", { name: "Account: sign in" })));
    expect(screen.getByRole("link", { name: "My Orders" })).toHaveAttribute("href", "/account/orders");
    expect(screen.queryByText("Orders in this browser")).toBeNull();
  });
});

describe("order history states", () => {
  it("renders a skeleton before saved orders are read (server and hydration render)", () => {
    const html = renderToString(<AppProviders><OrdersList /></AppProviders>);
    expect(html).toContain("Loading your orders");
    expect(html).not.toContain("No orders yet");
  });

  it("shows the empty state once read", () => {
    render(<AppProviders><OrdersList /></AppProviders>);
    expect(screen.getByRole("heading", { name: "No orders yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start shopping" })).toHaveAttribute("href", "/products");
  });
});

describe("shop toolbar", () => {
  it("offers category and sort dropdowns with labels, and the results summary", () => {
    render(<AppProviders><Marketplace products={products} categories={categories} vendorNames={vendorNames} /></AppProviders>);
    expect(screen.getByRole("combobox", { name: "Category" })).toHaveTextContent("All products");
    expect(screen.getByRole("combobox", { name: "Sort products" })).toHaveTextContent("Relevance");
    expect(screen.getByRole("button", { name: /Filter/ })).toBeInTheDocument();
    expect(screen.getByText(/Showing/).textContent).toBe(`Showing ${products.length} of ${products.length} products`);
    expect(screen.queryByRole("status", { name: "Updating products" })).toBeNull(); // nothing pending, no skeleton
  });
});

describe("hidden scrollbar", () => {
  it("hides the page scrollbar without disabling scrolling", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).toMatch(/html \{[^}]*scrollbar-width: none;/);
    expect(css).toMatch(/html::-webkit-scrollbar \{\s*display: none;/);
    expect(css).not.toMatch(/(html|body) \{[^}]*overflow(-y)?: hidden/);
  });
});
