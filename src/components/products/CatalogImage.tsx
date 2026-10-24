import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types/catalog";

interface CatalogImageProps {
  image: ImageAsset;
  sizes: string;
  /** Overrides the image's own alt, e.g. "" where the product name is already announced. */
  alt?: string;
  className?: string;
}

// One place that decides how a catalogue image is framed. Studio cut-outs (white backdrop, product
// centred at ~82% fill) are contained on a white surface so the whole product shows, as in the
// reference; lifestyle photos keep the cover crop until they are replaced. Fills its positioned parent.
export function CatalogImage({ image, sizes, alt, className }: CatalogImageProps) {
  return (
    <Image
      src={image.src}
      alt={alt ?? image.alt}
      fill
      sizes={sizes}
      className={cn(image.studio ? "bg-white object-contain p-[4%]" : "object-cover", className)}
    />
  );
}
