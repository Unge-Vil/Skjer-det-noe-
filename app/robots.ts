import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const PRIVATE_PATHS = ["/admin/", "/konto/", "/plattform/", "/api/", "/embed/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/public/"],
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "Google-Extended"],
        disallow: "/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}