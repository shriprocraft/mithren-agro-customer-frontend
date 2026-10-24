import { useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

// The supplied logo (public/images/mithren-agro-logo.png) is a 1254×1254 PNG with an opaque white
// background and wide empty margins. The file is used unmodified:
// - the frame shows only the artwork's bounding box (measured at x 59–1194, y 289–879);
// - an SVG filter, applied at display time, turns the near-white background transparent so the
//   glass shows through. Colour channels pass through untouched; only alpha is derived
//   (alpha = 4 − 4·mean(R,G,B), clamped), so the gold and green artwork stays fully opaque.
//   mix-blend-mode cannot do this here: the header and footer are translucent stacking contexts,
//   and blending inside them leaves a visible white box.
const SOURCE = 1254;
const ART = { x: 59, y: 289, width: 1135, height: 590 };
const KNOCKOUT_WHITE = "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1.333 -1.333 -1.333 0 4";

export function BrandMark({ className }: { className?: string }) {
  // useId output can contain characters that are awkward inside url(#…), so keep only safe ones.
  const filterId = `logo-knockout-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <Link
      href="/"
      className={cn(
        "relative inline-block shrink-0 overflow-hidden rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      style={{ aspectRatio: `${ART.width} / ${ART.height}` }}
    >
      <svg aria-hidden="true" focusable="false" className="absolute size-0">
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={KNOCKOUT_WHITE} />
        </filter>
      </svg>
      <Image
        src="/images/mithren-agro-logo.png"
        alt={`${siteConfig.legalName} home`}
        width={SOURCE}
        height={SOURCE}
        sizes="160px"
        loading="eager"
        className="absolute max-w-none"
        style={{
          width: `${(SOURCE / ART.width) * 100}%`,
          height: "auto",
          left: `${(-ART.x / ART.width) * 100}%`,
          top: `${(-ART.y / ART.height) * 100}%`,
          filter: `url(#${filterId})`,
        }}
      />
    </Link>
  );
}
