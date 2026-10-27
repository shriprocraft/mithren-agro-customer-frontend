// Destinations outside this storefront, and media whose files are not in the repository yet. Every
// value comes from a NEXT_PUBLIC_* environment variable (see .env.example and docs/CONFIGURATION.md);
// none is invented here. A missing or unsafe value is null, and the UI shows a "coming soon" or
// "unavailable" state instead of a broken link. NEXT_PUBLIC_* values are inlined at build time, so
// each is read with its literal name.

/**
 * An absolute https URL (http only for localhost during development), or null. Rejects javascript:,
 * data: and protocol-relative values, so a misconfigured variable can never become a script link.
 */
export function safeExternalUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol === "https:") return url.toString();
    if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) return url.toString();
    return null;
  } catch {
    return null;
  }
}

/** A same-site path ("/videos/intro.mp4", never "//host") or a safe external URL, or null. */
export function safeMediaUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) return trimmed;
  return safeExternalUrl(trimmed);
}

export const externalLinks = {
  /** The separate Investor Portal application (its own sign-in; nothing of it is rebuilt here). */
  investorPortal: safeExternalUrl(process.env.NEXT_PUBLIC_INVESTOR_PORTAL_URL),
  /** Agent application forms, once they exist. Until then the Agent Benefits page says "coming soon". */
  sellerAgentApplication: safeExternalUrl(process.env.NEXT_PUBLIC_SELLER_AGENT_APPLY_URL),
  deliveryAgentApplication: safeExternalUrl(process.env.NEXT_PUBLIC_DELIVERY_AGENT_APPLY_URL),
} as const;

export interface HomeVideo {
  id: string;
  title: string;
  description: string;
  /** Video file (MP4/WebM), or null until one is provided. */
  src: string | null;
  poster: { src: string; alt: string };
}

// The two homepage video cards. Titles and themes are provisional; replace the copy here and set
// the sources with the environment variables (or a file under public/videos and its path).
export const homeVideos: HomeVideo[] = [
  {
    id: "farm-to-home",
    title: "From Farm to Your Home",
    description: "How produce travels from local sellers to your door: sourcing, packing and delivery.",
    src: safeMediaUrl(process.env.NEXT_PUBLIC_VIDEO_FARM_TO_HOME_URL),
    poster: { src: "/images/home/hero-produce.jpg", alt: "Wicker basket of tomatoes, greens and fruit on a sunny lawn" },
  },
  {
    id: "grow-with-us",
    title: "Grow With Mithren Agro",
    description: "The wider Mithren Agro ecosystem: sellers, delivery partners and business opportunities.",
    src: safeMediaUrl(process.env.NEXT_PUBLIC_VIDEO_GROW_WITH_US_URL),
    poster: { src: "/images/home/farm-essentials.jpg", alt: "Young green seedlings growing in soil" },
  },
];
