import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { loc, type Locale } from "@/lib/i18n/config";
import { DetailView, type DetailData } from "@/components/DetailView";
import { absoluteUrl, jsonLd, listingMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const SELECT =
  "id,slug,updated_at,title,title_en,description,description_en,address,accessibility,area,price,age_min,age_max,url,image_url,weekday,start_time,end_time,recurrence_note,organizations!activities_organization_id_fkey(name,slug),categories(slug),municipalities(name,kommunenummer),activity_co_organizers(organizations(name,slug)),listing_exceptions!listing_exceptions_activity_id_fkey(occurrence_date,kind,message,reason,start_time,end_time)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDetail(row: any, locale: Locale): DetailData {
  return {
    id: row.id,
    kind: "activity",
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
    weekday: row.weekday,
    startTime: row.start_time,
    endTime: row.end_time,
    recurrenceNote: row.recurrence_note,
    exceptions: row.listing_exceptions ?? [],
    coOrganizers: (row.activity_co_organizers ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => c.organizations)
      .filter(Boolean)
      .map((o: { name: string; slug: string | null }) => ({ name: o.name, slug: o.slug ?? null })),
  };
}

async function fetchActivity(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
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
  const [row, locale] = await Promise.all([fetchActivity(slug), getLocale()]);
  const title = row ? (loc(locale, row.title, row.title_en) ?? row.title) : null;
  return title && row
    ? listingMetadata({
        title,
        description: loc(locale, row.description, row.description_en),
        imageUrl: row.image_url,
        pathname: `/aktivitet/${row.slug}`,
      })
    : { title: "Skjer det noe?" };
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [row, locale] = await Promise.all([fetchActivity(slug), getLocale()]);
  if (!row) notFound();
  const supabase = await createClient();
  await supabase.rpc("log_view", { p_type: "activity", p_id: row.id });
  const title = loc(locale, row.title, row.title_en) ?? row.title;
  const description = loc(locale, row.description, row.description_en);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            description,
            url: absoluteUrl(`/aktivitet/${row.slug}`),
            dateModified: row.updated_at,
            image: row.image_url ?? undefined,
          }),
        }}
      />
      <DetailView data={toDetail(row, locale)} />
    </>
  );
}
