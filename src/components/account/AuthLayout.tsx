import type { ReactNode } from "react";
import Image from "next/image";
import { Leaf } from "lucide-react";

// Two columns from lg: the form card, and a photograph with a short, factual brand message. Phones get
// the form only, so it starts on the first screen.
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-10">
      <div className="surface-card rounded-3xl p-5 sm:p-8 lg:p-10">{children}</div>
      <aside aria-hidden="true" className="relative hidden overflow-hidden rounded-3xl lg:block">
        <Image src="/images/home/marketplace-banner.jpg" alt="" fill sizes="(min-width: 1024px) 50vw, 0px" className="object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <Leaf className="size-8" />
          <p className="mt-3 font-heading text-2xl leading-snug font-semibold">Produce, pantry staples, farm supplies and apparel from independent sellers, in one cart.</p>
          <p className="mt-2 text-sm text-white/85">A preview storefront: listings, prices and sellers are sample data.</p>
        </div>
      </aside>
    </div>
  );
}
