"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { CircleAlert, Clapperboard, LoaderCircle, Play } from "lucide-react";
import type { HomeVideo } from "@/config/external-links";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "playing" | "paused" | "error";

// One homepage video. Nothing downloads until the visitor presses play (preload="none", optimised
// poster image), it never autoplays, and once started the browser's own controls take over (pause,
// seek, volume, full screen, keyboard). Without a configured source the card says "coming soon"
// and offers no play button; if the file fails to load it says so.
export function VideoCard({ video }: { video: HomeVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const titleId = `video-${video.id}-title`;
  const started = status === "playing" || status === "paused" || status === "loading";

  const play = () => {
    const element = ref.current;
    if (!element) return;
    setStatus("loading");
    element.play().catch(() => setStatus("error"));
  };

  return (
    <article aria-labelledby={titleId} className="surface-card overflow-hidden rounded-3xl">
      <div className="relative aspect-video bg-muted">
        {video.src && status !== "error" && (
          <video
            ref={ref}
            src={video.src}
            poster={video.poster.src}
            preload="none"
            playsInline
            controls={started}
            aria-label={video.title}
            onWaiting={() => setStatus("loading")}
            onPlaying={() => setStatus("playing")}
            onPause={() => setStatus("paused")}
            onEnded={() => setStatus("paused")}
            onError={() => setStatus("error")}
            className={cn("absolute inset-0 size-full bg-foreground object-cover", !started && "invisible")}
          />
        )}

        {!started && (
          <>
            <Image src={video.poster.src} alt={video.poster.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-foreground/45 via-foreground/5 to-transparent" />
          </>
        )}

        {status === "idle" && video.src && (
          <button
            type="button"
            onClick={play}
            className="group absolute inset-0 grid place-items-center outline-none"
            aria-label={`Play video: ${video.title}`}
          >
            <span className="grid size-16 place-items-center rounded-full bg-card/95 text-primary shadow-[var(--elevation-overlay)] transition-transform group-hover:scale-105 group-focus-visible:ring-4 group-focus-visible:ring-ring motion-reduce:transition-none">
              <Play className="ml-1 size-7 fill-current" aria-hidden="true" />
            </span>
          </button>
        )}

        {status === "loading" && (
          <span role="status" className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-full bg-card/90">
              <LoaderCircle className="size-6 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
              <span className="sr-only">Loading video…</span>
            </span>
          </span>
        )}

        {(!video.src || status === "error") && (
          <p
            role={status === "error" ? "alert" : undefined}
            className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-card/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-[var(--elevation-card)]"
          >
            {status === "error" ? (
              <><CircleAlert className="size-4 text-destructive" aria-hidden="true" />This video couldn’t be loaded</>
            ) : (
              <><Clapperboard className="size-4 text-primary" aria-hidden="true" />Video coming soon</>
            )}
          </p>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <h3 id={titleId} className="font-heading text-lg leading-snug font-semibold">{video.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{video.description}</p>
      </div>
    </article>
  );
}
