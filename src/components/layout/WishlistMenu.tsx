"use client";

import Image from "next/image";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CountBadge } from "@/components/layout/CountBadge";
import { useWishlist } from "@/context/WishlistContext";
import { effectivePrice, formatPrice } from "@/lib/formatters";
import type { Product } from "@/types/catalog";

export function WishlistMenu({ catalog }: { catalog: Product[] }) {
  const wishlist = useWishlist();
  const saved = catalog.filter((product) => wishlist.ids.includes(product.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-white/70" aria-label={`Wishlist, ${saved.length} saved`}>
          <Heart className="size-5" aria-hidden="true" />
          <CountBadge count={saved.length} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(20rem,calc(100vw-2rem))] gap-3 p-4">
        <p className="font-heading text-base font-medium">Wishlist</p>
        {saved.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing saved yet. Tap the heart on a product to keep it here.</p>
        ) : (
          <ul className="-mx-1 max-h-72 divide-y overflow-y-auto">
            {saved.map((product) => (
              <li key={product.id} className="flex items-center gap-3 px-1 py-2">
                {product.images[0] && (
                  <Image src={product.images[0].src} alt="" width={48} height={48} className={`size-12 rounded-lg ${product.images[0].studio ? "bg-white object-contain p-0.5 ring-1 ring-border" : "object-cover"}`} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(effectivePrice(product))}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => wishlist.toggle(product.id)} aria-label={`Remove ${product.name} from wishlist`}>
                  <X aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">Saved items are kept only on this page in the preview.</p>
      </PopoverContent>
    </Popover>
  );
}
