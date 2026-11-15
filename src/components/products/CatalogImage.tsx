"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types/catalog";

interface CatalogImageProps {
  /** The image as the API sends it: a site path (/images/…) or a full https URL (res.cloudinary.com). */
  image: ImageAsset | null | undefined;
  sizes: string;
  /** Overrides the image's own alt, e.g. "" where the product name is already announced. */
  alt?: string;
  className?: string;
}

// One place that decides how a catalogue image is framed. Studio cut-outs (white backdrop, product
// centred at ~82% fill) are contained on a white surface so the whole product shows, as in the
// reference; other photos (such as seller uploads) keep the cover crop. The src is used exactly as the
// API sends it. Without an image, or when it can't be loaded, a neutral placeholder takes its place
// (never another product's picture). Fills its positioned parent.
export function CatalogImage({ image, sizes, alt, className }: CatalogImageProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const src = image?.src?.trim();

  if (!image || !src || failed === src) {
    return (
      <span className={cn("absolute inset-0 grid place-items-center bg-muted text-muted-foreground", className)} role="img" aria-label={alt || "No photo available"}>
        <ImageOff className="size-[min(2rem,30%)]" aria-hidden="true" />
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt ?? image.alt}
      fill
      sizes={sizes}
      onError={() => setFailed(src)}
      className={cn(image.studio ? "bg-white object-contain p-[4%]" : "object-cover", className)}
    />
  );
}
