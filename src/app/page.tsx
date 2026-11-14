import { Suspense } from "react";
import { HomeContent } from "@/components/home/HomeContent";
import { PageLoading } from "@/components/layout/PageLoading";

// The data comes live from the backend on every request, so it loads inside this boundary: the page
// streams with a loading state instead of blocking navigation.
export default function Home() {
  return (
    <Suspense fallback={<PageLoading label="Loading the store…" />}>
      <HomeContent />
    </Suspense>
  );
}
