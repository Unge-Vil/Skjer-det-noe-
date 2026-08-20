import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { loc, type Locale } from "@/lib/i18n/config";
import { DetailView, type DetailData } from "@/components/DetailView";
import { absoluteUrl, jsonLd, listingMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const SELECT =
  "id,slug,updated_at,title,title_en,description,description_en,address,accessibility,area,price,age_min,age_max,url,image_url,starts_at,ends_at,organizations!events_organization_id_fkey(name,slug),categories(slug),municipalities(name,kommunenummer),event_co_organizers(organizations(name,slug))";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDetail(row: any, locale: Locale): DetailData {
  return {
    id: row.id,
    kind: "event",
    title: loc(locale, row.title, row.title_en) ?? row.title,
    description: loc(locale, row.description, row.description_en),
    organizationName: row.organizations?.name ?? null,
    organizationSlug: row.organizations?.slug ?? null,
    categorySlug: row.categories?.slug ?? null,
    municipalityName: row.municipalities?.name ?? null,
    municipalityNumber: row.municipalities?.kommunenummer ?? null,
    address: row.address,
    accessibility: row.accessibility,
    area: row.area,
    price: row.price,
    ageMin: row.age_min,
    ageMax: row.age_max,
    url: row.url,
    imageUrl: row.image_url,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    coOrganizers: (row.event_co_organizers ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => c.organizations)
      .filter(Boolean)
      .map((o: { name: string; slug: string | null }) => ({ name: o.name, slug: o.slug ?? null })),
  };
}

async function fetchEvent(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [row, locale] = await Promise.all([fetchEvent(slug), getLocale()]);
  const title = row ? (loc(locale, row.title, row.title_en) ?? row.title) : null;
  return title && row
    ? listingMetadata({
        title,
        description: loc(locale, row.description, row.description_en),
        imageUrl: row.image_url,
        pathname: `/arrangement/${row.slug}`,
      })
    : { title: "Skjer det noe?" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [row, locale] = await Promise.all([fetchEvent(slug), getLocale()]);
  if (!row) notFound();
  const supabase = await createClient();
  await supabase.rpc("log_view", { p_type: "event", p_id: row.id });
  const title = loc(locale, row.title, row.title_en) ?? row.title;
  const description = loc(locale, row.description, row.description_en);
  const organizer = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Event",
            name: title,
            description,
            url: absoluteUrl(`/arrangement/${row.slug}`),
            startDate: row.starts_at,
            endDate: row.ends_at ?? undefined,
            eventStatus: "https://schema.org/EventScheduled",
            image: row.image_url ?? undefined,
            organizer: organizer?.name
              ? { "@type": "Organization", name: organizer.name }
              : undefined,
            location: row.address
              ? { "@type": "Place", name: row.address, address: row.address }
              : undefined,
          }),
        }}
      />
      <DetailView data={toDetail(row, locale)} />
    </>
  );
}
