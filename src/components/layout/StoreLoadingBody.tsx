"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { LoadingState } from "@/components/checkout/PageState";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import { Container } from "@/components/layout/Container";

/**
 * The page area while the store frame loads (app/layout.tsx). The home page gets its own skeleton, so a
 * first visit to "/" never flashes the generic store placeholder (which, under the regular header with
 * its search bar, looked like the search page); other pages keep the generic one.
 */
export function StoreLoadingBody() {
  // Reading the URL needs its own boundary (Cache Components). "/" is known when the page is
  // prerendered, so its static shell already holds the home skeleton.
  return (
    <Suspense fallback={<GenericLoading />}>
      <ByPath />
    </Suspense>
  );
}

function ByPath() {
  return usePathname() === "/" ? <HomeSkeleton /> : <GenericLoading />;
}

function GenericLoading() {
  return (
    <main id="main-content" className="flex-1">
      <Container className="pt-4 pb-10 sm:pt-6">
        <LoadingState label="Loading the store…" fullHeight />
      </Container>
    </main>
  );
}
