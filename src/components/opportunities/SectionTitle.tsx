import type { ReactNode } from "react";
import { Heading } from "@/components/ui/typography";

/** Eyebrow plus h2, as used by the sections of the Agent Benefits and Investor Opportunities pages. */
export function SectionTitle({ id, eyebrow, children }: { id: string; eyebrow: string; children: ReactNode }) {
  return (
    <>
      <p className="text-xs font-semibold tracking-wide text-brand uppercase">{eyebrow}</p>
      <Heading id={id} variant="h2" className="mt-1.5 lg:text-3xl">{children}</Heading>
    </>
  );
}
