import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shown wherever the development mock is in use, so it can't be mistaken for real sign-in. */
export function DevelopmentAuthNotice({ className }: { className?: string }) {
  return (
    <p role="note" className={cn("flex gap-2 rounded-2xl border border-highlight bg-highlight/25 p-3 text-xs leading-relaxed text-foreground/85", className)}>
      <FlaskConical className="mt-px size-4 shrink-0 text-warning" aria-hidden="true" />
      <span><strong className="font-semibold">Development sign-in, not a real account.</strong> Nothing is verified and no message is sent. Unavailable in production builds.</span>
    </p>
  );
}
