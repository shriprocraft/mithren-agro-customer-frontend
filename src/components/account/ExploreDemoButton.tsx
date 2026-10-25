"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { safeNextPath } from "@/lib/demo-account";
import { cn } from "@/lib/utils";

interface ExploreDemoButtonProps {
  /** Where to go once the demo session has started; only same-site paths are used. Omit to stay. */
  next?: string | null;
  label?: string;
  className?: string;
}

// The one way into the demo account: starts a simulated session (no credentials involved) and opens
// the destination, the account overview by default.
export function ExploreDemoButton({ next, label = "Explore Demo Account", className }: ExploreDemoButtonProps) {
  const router = useRouter();
  const announce = useAnnounce();
  const { startDemoSession } = useDemoAccount();

  return (
    <Button
      size="lg"
      className={cn("w-full sm:w-auto", className)}
      onClick={() => {
        startDemoSession();
        announce("Demo account opened. This is sample data.");
        if (next !== undefined) router.push(safeNextPath(next));
      }}
    >
      <FlaskConical aria-hidden="true" />
      {label}
      <ArrowRight aria-hidden="true" />
    </Button>
  );
}
