import { useId } from "react";
import { cn } from "@/lib/utils";

/** Glossy green leaf used beside section titles and floating in the hero, as in the reference. Decorative. */
export function LeafMark({ className }: { className?: string }) {
  const id = useId();

  return (
    <svg viewBox="0 0 32 40" aria-hidden="true" focusable="false" className={cn("shrink-0", className)}>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#8fb35a" />
          <stop offset="0.55" stopColor="#5f8a3a" />
          <stop offset="1" stopColor="#3e6a2a" />
        </linearGradient>
      </defs>
      <path d="M16 1C28 9 31.5 24 17 39 3 28 2 12 16 1Z" fill={`url(#${id}-fill)`} />
      <path d="M16 1C9 9 6.5 18 9 27" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16.2 6.5C17.2 17 17.4 27 16.8 38" fill="none" stroke="#e9f2d8" strokeOpacity="0.7" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}
