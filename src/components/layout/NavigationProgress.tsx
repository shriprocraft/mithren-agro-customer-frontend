"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";

const MAX_PENDING_MS = 10_000;

// A thin bar along the top of the screen while a page navigation is under way. It starts when a
// same-site link is clicked and ends as soon as the URL changes, so it can never stay behind after
// the new page appears (and it gives up after 10 s regardless). Navigations that finish within
// 150 ms (prefetched pages, most of this site) show nothing. Route loading.tsx files and Suspense
// fallbacks show the page-level skeletons; this only confirms that the click was received.
export function NavigationProgress() {
  const location = `${usePathname()}?${useSearchParams().toString()}`;
  // The location the navigation started from: the bar is active only while we are still there.
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const active = startedAt !== null && startedAt === location;
  const visible = useDelayedFlag(active);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page, or only the #hash changes: no navigation to wait for.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setStartedAt(`${window.location.pathname}?${window.location.search.replace(/^\?/, "")}`);
      clearTimeout(timer);
      timer = setTimeout(() => setStartedAt(null), MAX_PENDING_MS);
    };
    // Capture phase: next/link calls preventDefault in its own handler, before a bubbling listener runs.
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5 overflow-hidden" data-testid="navigation-progress">
      <div className="h-full origin-left animate-[nav-progress_8s_cubic-bezier(0.1,0.7,0.2,1)_forwards] bg-primary motion-reduce:animate-none motion-reduce:opacity-70" />
      <span role="status" className="sr-only">Loading page…</span>
    </div>
  );
}
