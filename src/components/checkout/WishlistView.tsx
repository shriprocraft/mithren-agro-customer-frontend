"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { LoadingState, MessageState } from "@/components/checkout/PageState";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/context/WishlistContext";
import type { Product } from "@/types/catalog";

// Saved products, from the shared wishlist. Removing the heart here removes it everywhere.
export function WishlistView({ catalog, vendorNames }: { catalog: Product[]; vendorNames: Record<string, string> }) {
  const { ids, hydrated } = useWishlist();
  if (!hydrated) return <LoadingState label="Loading your wishlist…" />;
  const saved = ids.map((id) => catalog.find((p) => p.id === id)).filter((p): p is Product => !!p);

  if (saved.length === 0) {
    return (
      <MessageState icon={Heart} title="Your wishlist is empty" actions={<Button asChild><Link href="/products">Browse products</Link></Button>}>
        Tap the heart on any product to save it here.
      </MessageState>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {saved.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} vendorName={vendorNames[product.vendor_id] ?? "Independent seller"} imageShape={product.category_id === "cat-womens-apparel" ? "portrait" : "square"} />
        </li>
      ))}
    </ul>
  );
}
