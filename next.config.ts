import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Investing isn't available: the earlier plan and project pages (app/_investor-journey) are unrouted,
  // and their old URLs show the Coming Soon page. Temporary, so the URLs can return later.
  async redirects() {
    return [{ source: "/investors/:path+", destination: "/investors", permanent: false }];
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
