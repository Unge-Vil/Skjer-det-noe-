import type { SupabaseClient } from "@supabase/supabase-js";
import { loc, type Locale } from "@/lib/i18n/config";

export type DirectoryKind = "service" | "volunteer";

export interface DirectoryListing {
  id: string;
  kind: DirectoryKind;
  title: string;
  slug: string;
  description: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
  categorySlug: string | null;
  municipalityName: string | null;
  area: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  url: string | null;
  imageUrl: string | null;
  price: string | null;
  timeCommitment: string | null;
}

const SELECT =
  "id,kind,title,title_en,slug,description,description_en,area,contact_name,contact_email,contact_phone,url,image_url,price,time_commitment,organizations(name,slug),categories(slug),municipalities(name)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any, locale: Locale): DirectoryListing {
  return {
    id: row.id,
    kind: row.kind,
    title: loc(locale, row.title, row.title_en) ?? row.title,
    slug: row.slug,
    description: loc(locale, row.description, row.description_en),
    organizationName: row.organizations?.name ?? null,
    organizationSlug: row.organizations?.slug ?? null,
    categorySlug: row.categories?.slug ?? null,
    municipalityName: row.municipalities?.name ?? null,
    area: row.area,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    url: row.url,
    imageUrl: row.image_url,
    price: row.price,
    timeCommitment: row.time_commitment,
  };
}

/** Published directory listings of a kind, newest first. */
export async function fetchDirectoryListings(
  supabase: SupabaseClient,
  kind: DirectoryKind,
  locale: Locale,
): Promise<DirectoryListing[]> {
  const { data } = await supabase
    .from("directory_listings")
    .select(SELECT)
    .eq("kind", kind)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  return ((data as unknown[]) ?? []).map((r) => mapRow(r, locale));
}

/** A single published directory listing by kind + slug (for the detail page). */
export async function fetchDirectoryListing(
  supabase: SupabaseClient,
  kind: DirectoryKind,
  slug: string,
  locale: Locale,
): Promise<DirectoryListing | null> {
  const { data } = await supabase
    .from("directory_listings")
    .select(SELECT)
    .eq("kind", kind)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data ? mapRow(data, locale) : null;
}
