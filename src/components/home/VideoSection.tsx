import { VideoCard } from "@/components/home/VideoCard";
import { Container } from "@/components/layout/Container";
import { homeVideos } from "@/config/external-links";

// The two video cards, after About Mithren Agro and before the store search; side by side from md. Sources and copy live in
// config/external-links.ts; the cards handle a missing or broken source themselves.
export function VideoSection() {
  return (
    <section aria-labelledby="videos-title" className="py-6 sm:py-8">
      <Container>
        <h2 id="videos-title" className="sr-only">Videos about Mithren Agro</h2>
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {homeVideos.map((video) => <VideoCard key={video.id} video={video} />)}
        </div>
      </Container>
    </section>
  );
}
