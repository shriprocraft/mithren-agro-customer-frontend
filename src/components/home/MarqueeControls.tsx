"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { ScrollArrows } from "@/components/home/ScrollArrows";
import { Button } from "@/components/ui/button";

interface MarqueeControlsProps {
  /** id of the marquee viewport (the element CategoryGrid marks with data-paused). */
  targetId: string;
  /** Plural, for the arrows ("More categories"). */
  label: string;
  /** Singular, for the toggle ("Pause category animation"). */
  itemLabel: string;
}

// While the row moves on its own: a Pause / Play button (moving content needs a way to stop it,
// beyond hover and focus). It sets data-paused on the row, which holds the CSS animation where it is
// (animation-play-state), so Play carries on from the same spot. Its label and tooltip say what a
// press will do. With reduced motion the row does not move and scrolls by hand instead, so the usual
// arrows are shown (from md, as elsewhere).
export function MarqueeControls({ targetId, label, itemLabel }: MarqueeControlsProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    document.getElementById(targetId)?.toggleAttribute("data-paused", paused);
  }, [paused, targetId]);

  if (reducedMotion) {
    return (
      <div className="hidden md:block">
        <ScrollArrows targetId={targetId} label={label} />
      </div>
    );
  }

  const action = paused ? `Resume ${itemLabel} animation` : `Pause ${itemLabel} animation`;
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-controls={targetId}
      aria-label={action}
      title={action}
      onClick={() => setPaused((value) => !value)}
    >
      {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
    </Button>
  );
}
