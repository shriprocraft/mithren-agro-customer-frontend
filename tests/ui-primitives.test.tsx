import Link from "next/link";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heading, Text } from "@/components/ui/typography";

describe("Button", () => {
  it("renders an enabled button by default", () => {
    render(<Button>Shop now</Button>);
    const button = screen.getByRole("button", { name: "Shop now" });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("disables itself and reports busy while loading", () => {
    render(<Button loading>Saving</Button>);
    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("renders its child element when asChild is set", () => {
    render(
      <Button asChild>
        <Link href="/products">Browse</Link>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Browse" })).toHaveAttribute("href", "/products");
  });
});

describe("Input with Label", () => {
  it("is reachable by its visible label", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" />
      </>,
    );
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
  });
});

describe("Typography", () => {
  it("keeps the semantic tag independent of the visual variant", () => {
    render(
      <Heading as="h1" variant="display">
        Page title
      </Heading>,
    );
    const heading = screen.getByRole("heading", { level: 1, name: "Page title" });
    // The display variant (the homepage hero) is the one heading set in the serif.
    expect(heading).toHaveClass("font-display");
    expect(heading).not.toHaveClass("font-heading");
  });

  it("sets every other heading variant in the sans heading font", () => {
    render(<Heading>Section title</Heading>);
    expect(screen.getByRole("heading", { level: 2, name: "Section title" })).toHaveClass("font-heading");
  });

  it("renders text as a paragraph by default", () => {
    render(<Text variant="muted">Helper copy</Text>);
    expect(screen.getByText("Helper copy").tagName).toBe("P");
  });
});
