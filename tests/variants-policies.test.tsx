import { existsSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { policyLinks } from "@/components/policies/policy-links";
import { OrderPolicyNote } from "@/components/orders/OrderPolicyNote";
import { PurchasePanel } from "@/components/products/PurchasePanel";
import { QuickAddButton } from "@/components/products/QuickAddButton";
import { canRequestCancellation, isReturnEligibleCategory, policyConfig, returnWindowEnd } from "@/config/policies";
import { AppProviders } from "@/context/AppProviders";
import { bundles } from "@/data/bundles";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { addToCart, parseCart, removeFromCart, resolveLines, setCartQuantity, summarize } from "@/lib/cart";
import { advanceOrder, buildOrder } from "@/lib/orders";
import { defaultVariant, lineKey, resolveSelection } from "@/lib/variants";
import type { Address } from "@/types/order";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: push, back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  push.mockClear();
});
afterEach(() => vi.useRealTimers());

const catalog = [...products, ...bundles];
const byId = (id: string) => catalog.find((p) => p.id === id)!;
const onions = byId("p-red-onions");
const kurta = byId("p-floral-kurta-set");
const address: Address = { id: "a1", full_name: "Asha Rao", mobile: "9876543210", house: "12", street: "MG Road", city: "Mysuru", state: "Karnataka", pincode: "570001", type: "home" };
const apparelId = categories.find((c) => c.slug === "womens-apparel")!.id;

describe("product variants: data", () => {
  it("each listing's unit, price and stock describe its default option", () => {
    for (const product of catalog.filter((p) => p.variants)) {
      const selection = resolveSelection(product)!;
      expect([product.id, selection.unit, selection.price, selection.discounted_price, selection.stock_status]).toEqual([
        product.id, product.unit, product.price, product.discounted_price, product.stock_status,
      ]);
      expect(new Set(product.variants!.map((v) => v.id)).size).toBe(product.variants!.length);
    }
  });

  it("uses sizes for apparel and bangles, and weights, packs or volumes elsewhere", () => {
    const sized = new Set([apparelId, categories.find((c) => c.slug === "fancy-items")!.id]);
    for (const product of catalog.filter((p) => p.variants)) {
      const isApparel = product.category_id === apparelId;
      expect(product.variant_type === "size").toBe(sized.has(product.category_id));
      if (!isApparel) expect(product.variants!.every((v) => !/^(XS|S|M|L|XL|XXL)$/.test(v.label))).toBe(true);
    }
  });

  it("prices each option on its own (onions: 500 g, 1 kg, 2 kg, 5 kg)", () => {
    expect(onions.variants!.map((v) => [v.label, v.discounted_price ?? v.price])).toEqual([["500 g", 2000], ["1 kg", 3900], ["2 kg", 7600], ["5 kg", 18500]]);
    expect(new Set(onions.variants!.map((v) => v.price)).size).toBe(4);
  });

  it("resolves unknown option ids to null, never to another option", () => {
    expect(resolveSelection(onions, "3kg")).toBeNull();
    expect(resolveSelection(byId("p-papaya"), "1kg")).toBeNull();
    expect(resolveSelection(kurta, "m")!.description).toBe("2-piece set · Size M");
    expect(defaultVariant(kurta)!.label).toBe("M");
  });
});

describe("product variants: cart and orders", () => {
  it("keeps two options of one product as separate lines with their own prices", () => {
    let items = addToCart([], onions.id, 1, "500g").items;
    items = addToCart(items, onions.id, 2, "2kg").items;
    items = addToCart(items, onions.id, 1, "500g").items;
    expect(items).toEqual([{ product_id: onions.id, variant_id: "500g", quantity: 2 }, { product_id: onions.id, variant_id: "2kg", quantity: 2 }]);
    const { lines } = resolveLines(items, catalog);
    expect(lines.map((l) => [l.key, l.selection.unit, l.unit_price, l.line_total])).toEqual([
      [lineKey(onions.id, "500g"), "500 g", 2000, 4000],
      [lineKey(onions.id, "2kg"), "2 kg", 7600, 15200],
    ]);
    expect(summarize(lines).subtotal).toBe(19200);
    expect(setCartQuantity(items, lineKey(onions.id, "2kg"), 5)[1]!.quantity).toBe(5);
    expect(removeFromCart(items, lineKey(onions.id, "500g"))).toEqual([items[1]]);
  });

  it("treats a line saved before options existed as the default option", () => {
    const legacy = [{ product_id: onions.id, quantity: 20 }];
    const { lines } = resolveLines(legacy, catalog);
    expect([lines[0]!.key, lines[0]!.selection.unit, lines[0]!.unit_price]).toEqual([onions.id, "1 kg", 3900]);
    expect(addToCart(legacy, onions.id, 1, "1kg", "1kg").result).toBe("limit_reached"); // joins the line, no duplicate
    expect(addToCart([{ product_id: onions.id, quantity: 2 }], onions.id, 1, "1kg", "1kg").items).toEqual([{ product_id: onions.id, variant_id: "1kg", quantity: 3 }]);
    expect(addToCart([{ product_id: onions.id, quantity: 2 }], onions.id, 1, "500g", "1kg").items).toHaveLength(2); // another option is its own line
    expect(removeFromCart(legacy, lines[0]!.key)).toEqual([]); // the line's key removes it
  });

  it("drops lines whose option no longer exists and blocks out-of-stock options", () => {
    const { lines, missing } = resolveLines([{ product_id: onions.id, variant_id: "3kg", quantity: 1 }, { product_id: kurta.id, variant_id: "xxl", quantity: 1 }], catalog);
    expect(missing).toEqual([lineKey(onions.id, "3kg")]);
    expect(lines[0]!.issue).toBe("out_of_stock");
  });

  it("keeps the option through browser storage and into the order snapshot", () => {
    expect(parseCart([{ product_id: kurta.id, variant_id: "l", quantity: 1 }, { product_id: "x", variant_id: 5, quantity: 1 }])).toEqual([
      { product_id: kurta.id, variant_id: "l", quantity: 1 },
      { product_id: "x", quantity: 1 },
    ]);
    const { lines } = resolveLines([{ product_id: kurta.id, variant_id: "l", quantity: 1 }, { product_id: onions.id, variant_id: "5kg", quantity: 1 }], catalog);
    const order = buildOrder(lines, address, "MA-1", new Date("2026-10-27T10:00:00Z"));
    expect(order.items.map((i) => [i.variant_id, i.variant_label, i.unit, i.unit_price, i.category_id])).toEqual([
      ["l", "Size L", "2-piece set", 129900, apparelId],
      ["5kg", undefined, "5 kg", 18500, onions.category_id],
    ]);
    expect(order.total).toBe(129900 + 18500);
  });
});

describe("product page options", () => {
  it("updates price, pack and what is added when another option is chosen", () => {
    render(<AppProviders><PurchasePanel product={onions} /></AppProviders>);
    expect(screen.getByText("per 1 kg")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /500 g/ }));
    expect(screen.getByText("per 500 g")).toBeInTheDocument();
    expect(screen.getByText(/Total/).textContent).toContain("₹20");
    act(() => fireEvent.click(screen.getByRole("button", { name: /Add to cart/ })));
    expect(JSON.parse(localStorage.getItem("mithren.cart")!)).toEqual([{ product_id: onions.id, variant_id: "500g", quantity: 1 }]);
    expect(screen.getByText(`${onions.name} (500 g) is now in your cart.`)).toBeInTheDocument();
  });

  it("disables out-of-stock sizes and sends the chosen size to Buy now", () => {
    render(<AppProviders><PurchasePanel product={kurta} /></AppProviders>);
    expect(screen.getByRole("radio", { name: /XXL/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: /^L$/ }));
    act(() => fireEvent.click(screen.getByRole("button", { name: "Buy now" })));
    expect(JSON.parse(sessionStorage.getItem("mithren.checkout")!).source).toEqual({ kind: "buy_now", product_id: kurta.id, variant_id: "l", quantity: 1 });
    expect(push).toHaveBeenCalledWith("/checkout/address");
  });

  it("cards never pick a size for the shopper", () => {
    render(<AppProviders><QuickAddButton product={kurta} /></AppProviders>);
    expect(screen.getByRole("link", { name: /Choose size/ })).toHaveAttribute("href", `/products/${kurta.id}`);
    expect(screen.queryByRole("button", { name: /Add to cart/ })).toBeNull();
  });
});

describe("policy rules", () => {
  it("allows cancellation requests only before the packed status", () => {
    expect(policyConfig.cancellation.packedStatus).toBe("ready_for_dispatch");
    expect(["order_placed", "order_confirmed", "preparing", "ready_for_dispatch", "out_for_delivery", "delivered"].map((s) => canRequestCancellation(s as never))).toEqual([true, true, true, false, false, false]);
  });

  it("limits the 10-day return option to women's apparel, counted from delivery", () => {
    expect(policyConfig.returns.windowDays).toBe(10);
    expect(["womens-apparel", "fruits", "vegetables", "organic-groceries", "fertilizers", undefined].map(isReturnEligibleCategory)).toEqual([true, false, false, false, false, false]);
    expect(returnWindowEnd("2026-10-01T10:00:00.000Z").toISOString()).toBe("2026-10-11T10:00:00.000Z");
  });

  it("shows the right note on an order as it progresses", () => {
    const { lines } = resolveLines([{ product_id: kurta.id, variant_id: "m", quantity: 1 }, { product_id: onions.id, quantity: 1 }], catalog);
    let order = buildOrder(lines, address, "MA-1", new Date("2026-10-20T10:00:00Z"));
    const { rerender } = render(<OrderPolicyNote order={order} />);
    expect(screen.getByText(/You can ask to cancel this order until it is packed/)).toBeInTheDocument();
    for (let i = 0; i < 3; i++) order = advanceOrder(order, new Date("2026-10-21T10:00:00Z"));
    rerender(<OrderPolicyNote order={order} />);
    expect(screen.getByText(/can no longer be cancelled/)).toBeInTheDocument();
    order = advanceOrder(advanceOrder(order, new Date("2026-10-22T10:00:00Z")), new Date("2026-10-22T10:00:00Z"));
    rerender(<OrderPolicyNote order={order} />);
    const note = screen.getByText(/return requests can be made until/);
    expect(note.textContent).toContain(kurta.name);
    expect(note.textContent).not.toContain(onions.name);
    expect(note.textContent).toContain("1 Nov 2026");
  });

  it("every footer policy link opens its own page", () => {
    render(<SiteFooter categories={categories} />);
    const nav = screen.getByRole("navigation", { name: "Policies" });
    expect(within(nav).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(policyLinks.map((l) => l.href));
    for (const { href } of policyLinks) expect(existsSync(join(process.cwd(), "src/app", href, "page.tsx"))).toBe(true);
    for (const href of ["/about", "/support#contact", "/support#faqs", "/account/orders", "/account/track", "/agent-benefits", "/investors"]) {
      expect(document.querySelector(`footer a[href="${href}"]`)).not.toBeNull();
    }
  });
});

describe("footer", () => {
  it("splits the categories into Shop and More categories without losing a link", () => {
    render(<SiteFooter categories={categories} />);
    const shop = within(screen.getByRole("navigation", { name: "Shop" })).getAllByRole("link").map((a) => a.textContent);
    const more = within(screen.getByRole("navigation", { name: "More categories" })).getAllByRole("link").map((a) => a.textContent);
    expect(shop).toEqual(["All products", "Spinach", "Vegetables", "Fruits", "Organic Groceries"]);
    expect(more).toEqual(["Oil", "Cosmetics", "Fancy Items", "Women Apparels", "Fertilizers", "Combo offers"]);
  });

  it("keeps copyright and the preview notices in one row, with the Shri Pro Craft credit on its own centred line below", () => {
    const { container } = render(<SiteFooter categories={categories} />);
    const credit = screen.getByRole("link", { name: "Shri Pro Craft (opens in a new tab)" });
    expect(credit).toHaveAttribute("href", "https://shriprocraft.com/");
    expect(credit).toHaveAttribute("target", "_blank");
    expect(credit).toHaveAttribute("rel", "noopener noreferrer");
    const creditLine = credit.closest("p")!;
    expect(creditLine.textContent!.replace(/\s+/g, " ").trim()).toBe("Powered by Shri Pro Craft");
    expect(creditLine.parentElement).toHaveClass("text-center");
    const notices = screen.getByText(/All rights reserved/);
    expect(notices.textContent!.replace(/\s+/g, " ").trim()).toBe(
      "© Mithren Agro Pvt. Ltd. All rights reserved. · Preview storefront · Listings, prices and sellers are sample data · Policies are drafts under legal review",
    );
    // The credit is the footer's last line, after the notices.
    expect(container.querySelector("footer")!.lastElementChild).toContainElement(creditLine);
    expect(notices.compareDocumentPosition(creditLine) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByText(/Powered by/)).toHaveLength(1);
  });
});

describe("policy pages", () => {
  it.each([
    ["privacy-policy", "Privacy Policy", /no advertising or analytics cookies/],
    ["terms-and-conditions", "Terms and Conditions", /Consumer Protection Act, 2019/],
    ["cancellation-refund-policy", "Cancellation and Refund Policy", /customer-initiated cancellation is not permitted/],
    ["shipping-policy", "Shipping Policy", /estimates, not guarantees/],
    ["return-policy", "Return Policy", /10-day return option applies only to eligible women’s apparel/],
  ])("%s renders with the draft notice and its key rule", async (route, title, rule) => {
    const { default: Page } = await import(`@/app/${route}/page`);
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByText("Draft for legal review.")).toBeInTheDocument();
    expect(document.body.textContent).toMatch(rule);
    expect(document.body.textContent).not.toMatch(/no refunds under any circumstances|guaranteed delivery/i);
  });

  it("the return policy keeps produce and groceries out of the return window but open to problem reports", async () => {
    const { default: Page } = await import("@/app/return-policy/page");
    render(<Page />);
    expect(document.body.textContent).toMatch(/does not apply to fruits, vegetables, groceries/);
    expect(document.body.textContent).toMatch(/report an incorrect, damaged, defective, missing or materially misdescribed product/);
  });
});
