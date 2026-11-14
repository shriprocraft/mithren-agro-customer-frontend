"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CloudOff } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

// Shown when a page can't load its data from the backend (the API is unreachable, returns an error, or
// isn't configured). The store never substitutes sample data: it says what happened and offers a retry.
export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[store] A page couldn't load its data:", error);
  }, [error]);

  return (
    <main id="main-content" className="flex-1">
      <Container className="flex flex-col items-center py-20 text-center">
        <CloudOff className="size-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-semibold">We couldn’t reach the store</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Products, prices and stock come live from the store’s server, which isn’t responding right now. Nothing is shown rather than out-of-date
          or made-up listings. Please try again in a moment.
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => reset()}>Try again</Button>
          <Button asChild variant="outline"><Link href="/support">Get help</Link></Button>
        </div>
      </Container>
    </main>
  );
}
