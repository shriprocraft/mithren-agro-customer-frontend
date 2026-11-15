import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CatalogImage } from "@/components/products/CatalogImage";
import nextConfig from "../next.config";

const CLOUDINARY = "https://res.cloudinary.com/demo/image/upload/v1/mithren-agro/products/tomatoes.png";

describe("catalogue images", () => {
  it("allows Cloudinary images (https, any path) in next/image", () => {
    expect(nextConfig.images?.remotePatterns).toEqual([{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }]);
  });

  it("uses a full Cloudinary URL exactly as the API sends it", () => {
    render(<div style={{ position: "relative" }}><CatalogImage image={{ src: CLOUDINARY, alt: "Organic tomatoes" }} sizes="200px" /></div>);
    const img = screen.getByRole("img", { name: "Organic tomatoes" });
    const src = decodeURIComponent(img.getAttribute("src")!);
    expect(src).toContain(CLOUDINARY);
    expect(src).not.toContain("/images/https");
  });

  it("shows a placeholder when there is no photo", () => {
    render(<CatalogImage image={undefined} sizes="64px" />);
    expect(screen.getByRole("img", { name: "No photo available" })).toBeInTheDocument();
    render(<CatalogImage image={{ src: " ", alt: "Blank" }} sizes="64px" alt="" />);
    expect(screen.getAllByRole("img", { name: "No photo available" })).toHaveLength(2);
  });

  it("swaps in the placeholder when the photo can't be loaded", () => {
    render(<CatalogImage image={{ src: CLOUDINARY, alt: "Organic tomatoes" }} sizes="200px" />);
    fireEvent.error(screen.getByRole("img", { name: "Organic tomatoes" }));
    expect(screen.getByRole("img", { name: "No photo available" })).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull(); // no broken image is left on the page
  });
});
