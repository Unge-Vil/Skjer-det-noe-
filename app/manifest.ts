import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Skjer det noe?",
    short_name: "Skjer det noe?",
    description:
      "Finn faste aktiviteter, arrangementer og organisasjoner i nærheten av deg.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF8F2",
    theme_color: "#0A5C5B",
    lang: "nb",
    categories: ["lifestyle", "social", "events"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
