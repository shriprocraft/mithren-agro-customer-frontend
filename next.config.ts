import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Seller uploads (product photos, store logos, banners) are hosted on Cloudinary. next/image only
  // optimises remote images from hosts listed here; anything else is refused with a 400.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }],
  },
  partialPrefetching: true,
  // Investing isn't available: the earlier plan and project pages (app/_investor-journey) are unrouted,
  // and their old URLs show the Coming Soon page. Temporary, so the URLs can return later.
  async redirects() {
    return [
      { source: "/investors/:path+", destination: "/investors", permanent: false },
      // The marketplace (with its search and category filter) lives at /products; /search?category=<slug>
      // and /search?q=… lead there with the same query string.
      { source: "/search", destination: "/products", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
