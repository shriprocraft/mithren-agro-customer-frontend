import type { ReactNode } from "react";
import { Heading } from "@/components/ui/typography";

/** Title, one-line description and an optional action for each account section. */
export function AccountPageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <Heading as="h1" variant="h1" className="text-[1.625rem] sm:text-3xl">{title}</Heading>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
