import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The product name as a link to its details page, stretched over the whole card (its ::after covers
 * the card's positioned box). Controls that must stay separately clickable sit above it with z-10.
 */
export function ProductLink({ productId, children }: { productId: string; children: ReactNode }) {
  return (
    <Link
      href={`/products/${productId}`}
      className="outline-none after:absolute after:inset-0 after:z-0 after:rounded-[inherit] hover:text-primary focus-visible:after:ring-2 focus-visible:after:ring-ring"
    >
      {children}
    </Link>
  );
}
