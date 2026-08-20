import type { Locale } from "./i18n/config";

export type EmbedKind = "events" | "activities" | "kiosk";
export type EmbedLayout = "list" | "grid";
export type EmbedTheme = "auto" | "light" | "dark";

export interface EmbedConfig {
  kind: EmbedKind;
  layout: EmbedLayout;
  theme: EmbedTheme;
  item_limit: number;
  category_slugs: string[];
  allowed_origins: string[];
  owner_kind: "organization" | "municipality";
  owner_name: string | null;
  owner_slug: string | null;
}

/** Row shape returned by the `embed_listings` RPC. */
export interface EmbedListingRow {
  kind: "activity" | "event";
  id: string;
  title: string;
  title_en: string | null;
  slug: string;
  description: string | null;
  description_en: string | null;
  organization_name: string | null;
  category_slug: string | null;
  municipality_name: string | null;
  address: string | null;
  age_min: number | null;
  age_max: number | null;
  price: string | null;
  image_url: string | null;
  weekday: number | null;
  start_time: string | null;
  end_time: string | null;
  recurrence_note: string | null;
  starts_at: string | null;
  ends_at: string | null;
}

export interface EmbedItem {
  id: string;
  kind: "activity" | "event";
  title: string;
  slug: string;
  organizationName: string | null;
  categorySlug: string | null;
  address: string | null;
  ageMin: number | null;
  ageMax: number | null;
  price: string | null;
  imageUrl: string | null;
  weekday: number | null;
  startTime: string | null;
  endTime: string | null;
  recurrenceNote: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

export function rowToEmbedItem(row: EmbedListingRow, locale: Locale): EmbedItem {
  return {
    id: row.id,
    kind: row.kind,
    title: (locale === "en" && row.title_en) || row.title,
    slug: row.slug,
    organizationName: row.organization_name,
    categorySlug: row.category_slug,
    address: row.address,
    ageMin: row.age_min,
    ageMax: row.age_max,
    price: row.price,
    imageUrl: row.image_url,
    weekday: row.weekday,
    startTime: row.start_time,
    endTime: row.end_time,
    recurrenceNote: row.recurrence_note,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

const PUBLIC_ID_ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

/** Public, non-secret handle used in the embed URL. */
export function generatePublicId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => PUBLIC_ID_ALPHABET[b % PUBLIC_ID_ALPHABET.length]).join("");
}

/** Accepts a bare origin (scheme + host + optional port) and nothing else. */
export function normalizeOrigin(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!url.hostname) return null;
  if (url.username || url.password) return null;
  return url.origin;
}

/** Anonymous RPC call — the embed render path never touches auth cookies. */
async function callEmbedRpc<T>(fn: "embed_config" | "embed_listings", publicId: string): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_public_id: publicId }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
}

export async function fetchEmbedConfig(publicId: string): Promise<EmbedConfig | null> {
  const rows = await callEmbedRpc<EmbedConfig>("embed_config", publicId);
  return rows[0] ?? null;
}

export function fetchEmbedListings(publicId: string): Promise<EmbedListingRow[]> {
  return callEmbedRpc<EmbedListingRow>("embed_listings", publicId);
}

export function embedSnippet(baseUrl: string, publicId: string): string {
  return `<div data-sdn-embed="${publicId}"></div>\n<script src="${baseUrl}/embed.js" async></script>`;
}

export function embedIframeSnippet(baseUrl: string, publicId: string): string {
  return `<iframe src="${baseUrl}/embed/${publicId}" title="Skjer det noe?" width="100%" height="620" style="border:0" loading="lazy"></iframe>`;
}
