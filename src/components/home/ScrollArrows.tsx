"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScrollArrowsProps {
  /** id of the horizontally scrolling list these arrows control. */
  targetId: string;
  label: string;
}

// The reference's round glass prev/next buttons. They page the row by most of its visible width,
// disable at either end, and are hidden entirely when everything already fits.
export function ScrollArrows({ targetId, label }: ScrollArrowsProps) {
  const [state, setState] = useState({ overflows: false, atStart: true, atEnd: false });

  useEffect(() => {
    const row = document.getElementById(targetId);
    if (!row) return;
    const update = () =>
      setState({
        overflows: row.scrollWidth > row.clientWidth + 1,
        atStart: row.scrollLeft <= 1,
        atEnd: row.scrollLeft + row.clientWidth >= row.scrollWidth - 1,
      });
    update();
    row.addEventListener("scroll", update, { passive: true });
    // Fall back to window resizes where ResizeObserver is missing (older browsers, jsdom).
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (observer) observer.observe(row);
    else window.addEventListener("resize", update);
    return () => {
      row.removeEventListener("scroll", update);
      if (observer) observer.disconnect();
      else window.removeEventListener("resize", update);
    };
  }, [targetId]);

  if (!state.overflows) return null;

  const page = (direction: 1 | -1) => {
    const row = document.getElementById(targetId);
    if (!row) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: direction * row.clientWidth * 0.8, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" aria-controls={targetId} aria-label={`Previous ${label}`} disabled={state.atStart} onClick={() => page(-1)}>
        <ArrowLeft aria-hidden="true" />
      </Button>
      <Button variant="outline" size="icon" aria-controls={targetId} aria-label={`More ${label}`} disabled={state.atEnd} onClick={() => page(1)}>
        <ArrowRight aria-hidden="true" />
      </Button>
    </div>
  );
}
