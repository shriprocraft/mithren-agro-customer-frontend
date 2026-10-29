import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

// The finalised logo (docs/reference/Mithren_Agro_Finalised_Logo.png), exported from its transparent
// master (docs/reference/Mithren_Agro_Logos/Mithren_Agro_Pvt_Ltd_PNG.png) with only the empty
// transparent margin trimmed: 960×412, artwork untouched. It needs no crop or knockout filter; the
// height comes from `className` and the width follows the file's own aspect ratio.
const LOGO = { src: "/images/mithren-agro-logo.png", width: 960, height: 412 };

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "relative inline-block shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      style={{ aspectRatio: `${LOGO.width} / ${LOGO.height}` }}
    >
      <Image
        src={LOGO.src}
        alt={`${siteConfig.legalName} home`}
        width={LOGO.width}
        height={LOGO.height}
        sizes="200px"
        loading="eager"
        className="size-full object-contain"
      />
    </Link>
  );
}
