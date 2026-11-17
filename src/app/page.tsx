import { Suspense } from "react";
import { HomeContent } from "@/components/home/HomeContent";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";

// The data comes live from the backend on every request, so it loads inside this boundary: the page
// streams with a loading state instead of blocking navigation.
export default function Home() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
