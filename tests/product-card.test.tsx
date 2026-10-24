import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CartMenu } from "@/components/layout/CartMenu";
import { WishlistMenu } from "@/components/layout/WishlistMenu";
import { ProductCard } from "@/components/products/ProductCard";
import { AppProviders } from "@/context/AppProviders";
import { products } from "@/data/products";

const tomatoes = products.find((p) => p.slug === "tomatoes")!;
const jowar = products.find((p) => p.slug === "jowar")!;

function renderWithHeader(product = tomatoes) {
  return render(
    <AppProviders>
      <CartMenu catalog={products} />
      <WishlistMenu catalog={products} />
      <ProductCard product={product} vendorName="Green Acres Growers" />
    </AppProviders>,
  );
}

describe("ProductCard", () => {
  it("shows name, unit, seller, price and stock", () => {
    renderWithHeader();
    expect(screen.getByRole("link", { name: "Tomatoes" })).toHaveAttribute("href", "/products/p-tomatoes");
    expect(screen.getByText("1 kg")).toBeInTheDocument();
    expect(screen.getByText("Sold by Green Acres Growers")).toBeInTheDocument();
    expect(screen.getByText("₹40")).toBeInTheDocument();
    expect(screen.getByText("In stock")).toBeInTheDocument();
  });

  it("adds to cart with visible feedback and updates the cart count", () => {
    renderWithHeader();
    act(() => fireEvent.click(screen.getByRole("button", { name: /add to cart: tomatoes/i })));
    expect(screen.getByRole("button", { name: /added: tomatoes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cart, 1 item" })).toBeInTheDocument();
  });

  it("toggles the wishlist", () => {
    renderWithHeader();
    const heart = screen.getByRole("button", { name: "Save Tomatoes to wishlist" });
    act(() => fireEvent.click(heart));
    expect(heart).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Wishlist, 1 saved" })).toBeInTheDocument();
  });

  it("disables adding an out-of-stock product", () => {
    renderWithHeader(jowar);
    expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
  });

  it("opens a quick view from its own button, which links on to the full details", () => {
    renderWithHeader();
    act(() => fireEvent.click(screen.getByRole("button", { name: "Quick view: Tomatoes" })));
    expect(screen.getByRole("dialog", { name: "Tomatoes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View full details" })).toHaveAttribute("href", "/products/p-tomatoes");
    expect(screen.getByText(/Sample listing for this preview/)).toBeInTheDocument();
  });
});
