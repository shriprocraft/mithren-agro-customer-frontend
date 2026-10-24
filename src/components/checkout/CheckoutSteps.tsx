import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["Cart", "Address", "Review", "Confirmation"] as const;
export type CheckoutStep = (typeof steps)[number];

/** Progress through checkout; the current step is announced with aria-current. */
export function CheckoutSteps({ current }: { current: CheckoutStep }) {
  const index = steps.indexOf(current);
  return (
    <ol aria-label="Checkout progress" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      {steps.map((step, i) => (
        <li key={step} aria-current={i === index ? "step" : undefined} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden="true" className="h-px w-5 bg-border sm:w-8" />}
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full text-xs font-semibold",
              i < index && "bg-primary text-primary-foreground",
              i === index && "bg-primary text-primary-foreground ring-4 ring-secondary",
              i > index && "border border-input text-muted-foreground",
            )}
          >
            {i < index ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
          </span>
          <span className={cn(i === index ? "font-semibold text-foreground" : "text-muted-foreground")}>
            {step}
            {i < index && <span className="sr-only"> (done)</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
