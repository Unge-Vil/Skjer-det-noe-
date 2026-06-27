import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { loc, type Locale } from "@/lib/i18n/config";
import { DetailView, type DetailData } from "@/components/DetailView";

export const dynamic = "force-dynamic";

const SELECT =
  "id,title,title_en,description,description_en,address,price,age_min,age_max,url,image_url,weekday,start_time,end_time,recurrence_note,organizations(name,slug),categories(slug),municipalities(name,kommunenummer)";

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
    price: row.price,
    ageMin: row.age_min,
    ageMax: row.age_max,
    url: row.url,
    imageUrl: row.image_url,
    weekday: row.weekday,
    startTime: row.start_time,
    endTime: row.end_time,
    recurrenceNote: row.recurrence_note,
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
  return { title: title ? `${title} – Skjer det noe?` : "Skjer det noe?" };
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [row, locale] = await Promise.all([fetchActivity(slug), getLocale()]);
  if (!row) notFound();
  return <DetailView data={toDetail(row, locale)} />;
}
