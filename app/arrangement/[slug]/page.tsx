import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DetailView, type DetailData } from "@/components/DetailView";

export const dynamic = "force-dynamic";

const SELECT =
  "id,title,description,address,price,age_min,age_max,url,image_url,starts_at,ends_at,organizations(name),categories(slug),municipalities(name,kommunenummer)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDetail(row: any): DetailData {
  return {
    id: row.id,
    kind: "event",
    title: row.title,
    description: row.description,
    organizationName: row.organizations?.name ?? null,
    categorySlug: row.categories?.slug ?? null,
    municipalityName: row.municipalities?.name ?? null,
    municipalityNumber: row.municipalities?.kommunenummer ?? null,
    address: row.address,
    price: row.price,
    ageMin: row.age_min,
    ageMax: row.age_max,
    url: row.url,
    imageUrl: row.image_url,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
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
  const row = await fetchEvent(slug);
  return { title: row ? `${row.title} – Skjer det noe?` : "Skjer det noe?" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await fetchEvent(slug);
  if (!row) notFound();
  return <DetailView data={toDetail(row)} />;
}
