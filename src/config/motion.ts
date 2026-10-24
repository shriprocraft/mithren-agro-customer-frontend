// One shared duration/easing set for Framer Motion (guide, Section H).
export const motionTokens = {
  duration: { fast: 0.18, base: 0.28 },
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
} as const;
