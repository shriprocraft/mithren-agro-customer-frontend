import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PurchasePanel } from "@/components/products/PurchasePanel";
import { StockBadge } from "@/components/products/StockBadge";
import { AppProviders } from "@/context/AppProviders";
import { addToCart, clampQuantity, limitMessage, quantityLimits } from "@/lib/cart";
import { products } from "./fixtures/catalog/products";
import type { Product } from "@/types/catalog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
beforeEach(() => localStorage.clear());

const single = products.find((p) => !p.variants?.length)!;
const low: Product = { ...single, stock_status: "low_stock", available_stock: 4, is_low_stock: true };

describe("stock and quantity limits", () => {
  it("caps a line at the stock available and the seller's maximum", () => {
    expect(quantityLimits({}, { available_stock: 4 })).toEqual({ min: 1, max: 4, byStock: true });
    expect(quantityLimits({ max_quantity: 3, min_quantity: 2 }, { available_stock: 50 })).toEqual({ min: 2, max: 3, byStock: false });
    expect(quantityLimits({}, {})).toEqual({ min: 1, max: 20, byStock: false });
    expect(limitMessage({ min: 1, max: 4, byStock: true })).toBe("Only 4 available");
    expect(clampQuantity(9, 4)).toBe(4);
    expect(addToCart([], "p", 9, undefined, undefined, 4).items[0]!.quantity).toBe(4);
    expect(addToCart([{ product_id: "p", quantity: 4 }], "p", 1, undefined, undefined, 4).result).toBe("limit_reached");
    expect(addToCart([], "p", 1, undefined, undefined, 0).result).toBe("limit_reached");
  });

  it("says how many are left when stock is low", () => {
    render(<StockBadge status="low_stock" available={3} />);
    expect(screen.getByText("Only 3 left in stock")).toBeInTheDocument();
  });

  it("stops the product page's stepper at the stock available", () => {
    render(<AppProviders><PurchasePanel product={low} /></AppProviders>);
    expect(screen.getByText("Only 4 left in stock")).toBeInTheDocument();
    const more = screen.getByRole("button", { name: "Increase quantity" });
    for (let i = 0; i < 5; i++) act(() => fireEvent.click(more));
    expect(screen.getByRole("spinbutton", { name: "Quantity" })).toHaveValue(4);
    expect(more).toBeDisabled();
    expect(screen.getByText("Only 4 available")).toBeInTheDocument();
  });

  it("disables Add to cart when out of stock but keeps the wishlist open", () => {
    render(<AppProviders><PurchasePanel product={{ ...single, stock_status: "out_of_stock", available_stock: 0 }} /></AppProviders>);
    expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
    expect(screen.getByText(/save it to your wishlist/i)).toBeInTheDocument();
  });
});
