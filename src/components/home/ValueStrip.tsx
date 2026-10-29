import { BadgeCheck, Layers, Scale, Store } from "lucide-react";
import { Container } from "@/components/layout/Container";

// Each point describes how the storefront presents listings (scope §2.2, §4.5): every product names
// its seller and shows its pack size, and an organic label may appear only after the certificate
// review the scope requires. That review is an admin-portal dependency; no sample listing carries
// an organic label yet. No delivery, freshness or certification promises are made.
const points = [
  { Icon: Store, title: "Independent sellers", text: "Seller named on every item" },
  { Icon: Scale, title: "Clear pack sizes", text: "Priced per pack or unit" },
  { Icon: BadgeCheck, title: "Verified labels only", text: "Organic tags after review" },
  { Icon: Layers, title: "Nine categories, one cart", text: "Produce, pantry, skincare and more" },
];

// The strip across the bottom of the hero: one clean frosted panel (near-opaque white, a light blur
// and a hairline border), tinted icon circles, two regular-weight lines and soft dividers. The earlier
// liquid-glass treatment (an outer translucent plate, reflection gradient and bright inset rims) was
// removed on request; only this panel remains. Phones show the titles only, in a tight 2 × 2 grid.
export function ValueStrip() {
  return (
    <Container>
      <div className="xl:px-6">
        <ul className="grid border border-border bg-card/90 shadow-[0_10px_26px_-20px_rgb(var(--shadow-tint)/0.35)] backdrop-blur-sm grid-cols-2 gap-x-2 gap-y-3 rounded-[1.25rem] p-3 sm:gap-x-3 sm:gap-y-4 sm:p-4 lg:grid-cols-4 lg:gap-0 lg:px-3 lg:py-2.5 xl:py-3">
          {points.map(({ Icon, title, text }) => (
            <li key={title} className="flex items-center gap-2 sm:gap-3 lg:gap-2 lg:px-2.5 xl:gap-3.5 xl:px-4 lg:[&+li]:border-l lg:[&+li]:border-foreground/7">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-primary sm:size-10 lg:size-9 xl:size-12">
                <Icon className="size-4 sm:size-5" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="min-w-0 text-xs leading-snug text-foreground/85 xl:text-[0.8125rem]">
                <span className="block">{title}</span>
                <span className="hidden text-foreground/65 sm:block lg:text-[0.6875rem] xl:text-[0.8125rem]">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
