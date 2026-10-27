import Image from "next/image";
import { cn } from "@/lib/utils";

// Out-of-focus foliage along the page edges below the hero, as in the reference: a few sparse
// accents, not a texture. The hero photograph brings its own foliage, so nothing sits behind it.
// Positions are fractions of the page height so they spread out however long the page is; the
// wrapper clips them, so they never cause horizontal scrolling. All start below the first screen,
// so they load lazily.
//
// Performance: the blur and the soft oval fade are baked into the image
// (scripts/make-backdrop-image.mjs). Applying them live (CSS filter: blur() plus mask-image on these
// large elements) made the browser redraw blurred, masked layers while scrolling, which showed up
// as long frames in the scroll traces (docs/PERFORMANCE.md). Only opacity and a mirror transform
// remain, which cost nothing extra.
const clusters = [
  { top: "30%", side: "left", flip: true },
  { top: "55%", side: "right", flip: false },
  { top: "80%", side: "left", flip: false },
] as const;

export function PageBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {clusters.map((cluster) => (
        <div
          key={cluster.top}
          style={{ top: cluster.top }}
          className={cn(
            "absolute h-80 w-64 opacity-45 sm:opacity-60",
            cluster.side === "left" ? "-left-48 lg:-left-36" : "-right-48 lg:-right-36",
            cluster.flip && "-scale-x-100",
          )}
        >
          <Image src="/images/home/backdrop-foliage.webp" alt="" fill sizes="256px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}
