import type { NextConfig } from "next";

const NO_FRAMING = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow remote images (org logos / listing images) over https.
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      // Admin and auth surfaces must never be framed. /embed/* is deliberately
      // excluded — middleware sets its frame-ancestors per embed.
      ...["/admin/:path*", "/kommune/:path*", "/plattform/:path*", "/logg-inn", "/registrer", "/glemt-passord", "/oppdater-passord", "/konto/:path*"].map(
        (source) => ({ source, headers: NO_FRAMING }),
      ),
      {
        source: "/embed.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;

// Enables Cloudflare bindings (and the Workers runtime emulation) during
// `next dev`. No-op when not running under OpenNext/Cloudflare.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
