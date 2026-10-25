import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CatalogImage } from "@/components/products/CatalogImage";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types/catalog";

interface CategoryCardProps {
  href: string;
  name: string;
  image: ImageAsset;
  /** Extra words for screen readers, such as the number of products. */
  detail?: string;
  className?: string;
  sizes?: string;
}

// Small tile from the reference: inset photo on top, name and arrow below. The whole tile is one link.
export function CategoryCard({ href, name, image, detail, className, sizes = "(min-width: 1024px) 180px, 40vw" }: CategoryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group surface-card relative flex h-full flex-col rounded-2xl p-1.5 outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <span className={cn("relative block aspect-[16/10] overflow-hidden rounded-xl", image.studio ? "bg-white" : "bg-muted")}>
        <CatalogImage
          image={image}
          sizes={sizes}
          // Wide studio tiles already carry their own white margin.
          className="p-0 transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </span>
      <span className="flex min-h-10 items-center justify-between gap-1 px-1.5 pt-1 text-[0.8125rem] leading-tight font-medium text-foreground">
        <span>
          {name}
          {detail && <span className="sr-only">, {detail}</span>}
        </span>
        <ArrowRight
          className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
