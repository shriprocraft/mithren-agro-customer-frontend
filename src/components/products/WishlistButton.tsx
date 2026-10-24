"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useWishlist } from "@/context/WishlistContext";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  productName: string;
  /** Floating icon over a card image, or a labelled outline button. */
  appearance?: "icon" | "labelled";
  className?: string;
}

export function WishlistButton({ productId, productName, appearance = "icon", className }: WishlistButtonProps) {
  const wishlist = useWishlist();
  const announce = useAnnounce();
  const saved = wishlist.has(productId);

  const handleToggle = () => {
    const nowSaved = wishlist.toggle(productId);
    announce(nowSaved ? `${productName} saved to wishlist.` : `${productName} removed from wishlist.`);
  };

  const heart = <Heart aria-hidden="true" className={cn(saved && "fill-current")} />;

  if (appearance === "labelled") {
    return (
      <Button variant="outline" onClick={handleToggle} aria-pressed={saved} className={className}>
        {heart}
        {saved ? "Saved" : "Save to wishlist"}
      </Button>
    );
  }

  // 44px target around a small glass circle, as drawn in the reference.
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-pressed={saved}
      aria-label={`Save ${productName} to wishlist`}
      className={cn(
        "text-foreground hover:bg-transparent aria-expanded:bg-transparent",
        saved && "text-destructive hover:text-destructive",
        className,
      )}
    >
      <span className="glass-chip grid size-8 place-items-center rounded-full transition-colors group-hover/button:bg-white/90">
        {heart}
      </span>
    </Button>
  );
}
