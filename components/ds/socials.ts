// Shared definition of the social platforms we support. Stored on
// organizations/municipalities as a jsonb map { key: url }. Lucide dropped its
// brand glyphs, so the icons live in SocialIcon.tsx instead.

export type SocialKey =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "x"
  | "linkedin";

export interface SocialPlatform {
  key: SocialKey;
  label: string;
  placeholder: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@…" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@…" },
  { key: "x", label: "X", placeholder: "https://x.com/…" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/…" },
];

export type SocialLinks = Partial<Record<SocialKey, string>>;

/** Normalise a raw jsonb value into a typed, trimmed map (drops empty values). */
export function parseSocialLinks(value: unknown): SocialLinks {
  if (!value || typeof value !== "object") return {};
  const out: SocialLinks = {};
  for (const p of SOCIAL_PLATFORMS) {
    const raw = (value as Record<string, unknown>)[p.key];
    if (typeof raw === "string" && raw.trim()) out[p.key] = raw.trim();
  }
  return out;
}
