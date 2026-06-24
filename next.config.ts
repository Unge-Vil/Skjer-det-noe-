import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow remote images (org logos / listing images) over https.
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;

// Enables Cloudflare bindings (and the Workers runtime emulation) during
// `next dev`. No-op when not running under OpenNext/Cloudflare.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
