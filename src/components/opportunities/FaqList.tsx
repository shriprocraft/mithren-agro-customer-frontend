import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export interface Faq {
  q: string;
  a: ReactNode;
}

// Native <details> disclosures: keyboard and screen-reader friendly with no script. Shared by the
// help, Agent Benefits and Investor Opportunities pages.
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card">
      {faqs.map((faq) => (
        <details key={faq.q} className="group">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
            {faq.q}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
          </summary>
          <div className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{faq.a}</div>
        </details>
      ))}
    </div>
  );
}
