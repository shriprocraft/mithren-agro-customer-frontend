import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { LeafMark } from "@/components/layout/LeafMark";
import { Heading, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  id: string;
  title: string;
  description?: string;
  eyebrow?: string;
  action?: { href: string; label: string };
  /** Extra controls after the action link, such as carousel arrows. */
  controls?: ReactNode;
  className?: string;
}

// Glossy leaf hanging just outside the content edge, compact title, "view all" link and optional
// arrows on the right, following the reference image's section headers.
export function SectionHeading({ id, title, description, eyebrow, action, controls, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-5", className)}>
      <div className="relative max-w-2xl pl-9 lg:pl-7">
        <LeafMark className="absolute top-0 left-0 h-8 w-6 -rotate-[28deg] lg:-left-4" />
        {eyebrow && <p className="mb-1 text-xs font-semibold tracking-wide text-brand uppercase">{eyebrow}</p>}
        <Heading id={id} variant="h2">
          {title}
        </Heading>
        {description && (
          <Text variant="muted" className="mt-0.5">
            {description}
          </Text>
        )}
      </div>
      {(action || controls) && (
        <div className="flex items-center gap-4">
          {action && (
            <a
              href={action.href}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-1 text-[0.8125rem] font-medium text-foreground underline-offset-4 hover:text-brand hover:underline"
            >
              {action.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          )}
          {controls}
        </div>
      )}
    </div>
  );
}
