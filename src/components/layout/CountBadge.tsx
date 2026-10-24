"use client";

import { AnimatePresence, motion } from "framer-motion";
import { motionTokens } from "@/config/motion";

/** Small count bubble for header icons; pops when the number changes. */
export function CountBadge({ count }: { count: number }) {
  return (
    <AnimatePresence initial={false}>
      {count > 0 && (
        <motion.span
          key={count}
          aria-hidden="true"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease }}
          className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.6875rem] font-semibold text-primary-foreground ring-2 ring-background"
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
