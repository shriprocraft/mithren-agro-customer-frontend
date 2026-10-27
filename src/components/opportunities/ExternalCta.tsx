"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExternalCtaProps {
  /** Configured destination (already validated by config/external-links.ts), or null. */
  href: string | null;
  label: string;
  /** Shown instead of the label when no destination is configured. */
  unavailableLabel: string;
  /** Explains the unavailable state; tied to the button with aria-describedby. */
  unavailableNote: ReactNode;
  id: string;
  variant?: "default" | "outline";
  className?: string;
}

// A call to action that leaves this storefront (Investor Portal, agent applications). With a
// destination it is a real link that shows "Opening…" until the browser navigates; without one it
// is a disabled button plus a note, so it never looks like a working application form.
export function ExternalCta({ href, label, unavailableLabel, unavailableNote, id, variant = "default", className }: ExternalCtaProps) {
  const [opening, setOpening] = useState(false);

  // Coming back with the browser's Back button restores the page from cache: clear "Opening…".
  useEffect(() => {
    const reset = () => setOpening(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  if (!href) {
    return (
      <div className="grid gap-1.5">
        <Button type="button" variant={variant} disabled aria-describedby={`${id}-note`} className={className}>
          <Clock aria-hidden="true" />
          {unavailableLabel}
        </Button>
        <p id={`${id}-note`} className="max-w-xs text-xs text-muted-foreground">{unavailableNote}</p>
      </div>
    );
  }

  return (
    <Button asChild variant={variant} className={className}>
      <a href={href} rel="noopener" onClick={() => setOpening(true)} aria-busy={opening || undefined}>
        {opening ? "Opening…" : label}
        <ArrowUpRight aria-hidden="true" />
      </a>
    </Button>
  );
}
