import { Sprout } from "lucide-react";
import { Container } from "@/components/layout/Container";

// A thin, secondary strip as in the reference. Deliberately makes no delivery, pricing or
// freshness promises (scope §2.1, §4.1).
export function AnnouncementBar() {
  return (
    <div className="bg-linear-to-r from-band via-band to-[color-mix(in_oklab,var(--band),var(--primary)_8%)] text-secondary-foreground">
      <Container className="flex min-h-7 items-center justify-center gap-1.5 py-1 text-center text-[0.6875rem] leading-tight xl:min-h-[1.875rem] xl:text-xs">
        <Sprout className="hidden size-3.5 shrink-0 sm:block" aria-hidden="true" />
        <p>
          <span className="hidden md:inline">
            Produce, pantry staples, farm supplies and apparel from independent sellers ·{" "}
          </span>
          <strong className="font-medium">Preview storefront:</strong> all listings and prices are sample data.
        </p>
      </Container>
    </div>
  );
}
