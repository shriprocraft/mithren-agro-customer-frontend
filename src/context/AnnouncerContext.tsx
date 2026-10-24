"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

// One polite live region for cart and wishlist feedback (guide, Section N).
const AnnouncerContext = createContext<((message: string) => void) | null>(null);

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");

  // Toggling a trailing space makes repeated identical messages announce again.
  const announce = useCallback((next: string) => {
    setMessage((previous) => (previous === next ? `${next} ` : next));
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <p aria-live="polite" role="status" className="sr-only">
        {message}
      </p>
    </AnnouncerContext.Provider>
  );
}

export function useAnnounce() {
  const announce = useContext(AnnouncerContext);
  if (!announce) throw new Error("useAnnounce must be used inside AnnouncerProvider");
  return announce;
}
