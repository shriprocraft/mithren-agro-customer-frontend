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
  { Icon: Layers, title: "Five categories, one cart", text: "Produce, pantry and apparel" },
];

// The target's layered strip across the bottom of the hero: a faint outer glass plate holding a
// brighter glass panel, white glass icon circles, two regular-weight lines and soft dividers.
export function ValueStrip() {
  return (
    <Container>
      <div className="rounded-[1.6rem] lg:bg-white/20 lg:p-1 lg:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.55),0_16px_40px_-28px_rgb(46_64_34/0.4)] lg:backdrop-blur-sm xl:px-6">
        <ul className="glass-panel grid grid-cols-2 gap-x-3 gap-y-4 rounded-[1.25rem] p-4 lg:grid-cols-4 lg:gap-0 lg:px-3 lg:py-2.5 xl:py-3">
          {points.map(({ Icon, title, text }) => (
            <li key={title} className="flex items-center gap-3 lg:gap-2 lg:px-2.5 xl:gap-3.5 xl:px-4 lg:[&+li]:border-l lg:[&+li]:border-foreground/7">
              <span className="glass-chip grid size-10 shrink-0 place-items-center rounded-full text-foreground/80 lg:size-9 xl:size-12">
                <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="min-w-0 text-xs leading-snug text-foreground/85 xl:text-[0.8125rem]">
                <span className="block">{title}</span>
                <span className="block text-foreground/65 lg:text-[0.6875rem] xl:text-[0.8125rem]">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
