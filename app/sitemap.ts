import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const [activities, events, organizations, municipalities, municipalityPages, directoryListings] = await Promise.all([
    supabase
      .from("activities")
      .select("slug,updated_at,image_url")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(10_000),
    supabase
      .from("events")
      .select("slug,updated_at,image_url")
      .eq("status", "published")
      .gte("starts_at", now)
      .order("updated_at", { ascending: false })
      .limit(10_000),
    supabase
      .from("organizations")
      .select("slug,updated_at,logo_url")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(10_000),
    supabase.from("municipalities").select("slug,updated_at").order("updated_at", { ascending: false }).limit(10_000),
    supabase
      .from("municipality_pages")
      .select("slug,updated_at,municipalities!inner(slug)")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(10_000),
    supabase
      .from("directory_listings")
      .select("kind,slug,updated_at,image_url")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(10_000),
  ]);

  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    ...((activities.data ?? []).map((activity) => ({
      url: absoluteUrl(`/aktivitet/${activity.slug}`),
      lastModified: activity.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: activity.image_url ? [activity.image_url] : undefined,
    }))),
    ...((events.data ?? []).map((event) => ({
      url: absoluteUrl(`/arrangement/${event.slug}`),
      lastModified: event.updated_at,
      changeFrequency: "daily" as const,
      priority: 0.9,
      images: event.image_url ? [event.image_url] : undefined,
    }))),
    ...((organizations.data ?? []).map((organization) => ({
      url: absoluteUrl(`/organisasjon/${organization.slug}`),
      lastModified: organization.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: organization.logo_url ? [organization.logo_url] : undefined,
    }))),
    ...((municipalities.data ?? []).map((municipality) => ({
      url: absoluteUrl(`/kommune/${municipality.slug}`),
      lastModified: municipality.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))),
    ...((municipalityPages.data ?? []).flatMap((page) => {
      const municipality = Array.isArray(page.municipalities) ? page.municipalities[0] : page.municipalities;
      return municipality ? [{
        url: absoluteUrl(`/kommune/${municipality.slug}/${page.slug}`),
        lastModified: page.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }] : [];
    })),
    ...((directoryListings.data ?? []).map((listing) => ({
      url: absoluteUrl(`/${listing.kind === "service" ? "tjeneste" : "frivillig"}/${listing.slug}`),
      lastModified: listing.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: listing.image_url ? [listing.image_url] : undefined,
    }))),
  ];
}