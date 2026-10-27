"use client";

import { useEffect, useState } from "react";

/**
 * True once `active` has stayed true for `delayMs`, false as soon as it turns false. Loading
 * indicators use it so instant updates never flash a skeleton, while slower ones still show one.
 */
export function useDelayedFlag(active: boolean, delayMs = 150): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setShown(true), delayMs);
    return () => {
      clearTimeout(timer);
      setShown(false);
    };
  }, [active, delayMs]);
  return active && shown;
}
