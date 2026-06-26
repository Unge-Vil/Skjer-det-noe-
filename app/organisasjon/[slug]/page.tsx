import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import type { Listing } from "@/lib/types";
import { Icon } from "@/components/ds/Icon";
import { ListingCard } from "@/components/ListingCard";

export const dynamic = "force-dynamic";

async function fetchOrg(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select(
      "id,name,description,website,address,organization_municipalities(municipalities(name))",
    )
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
  const org = await fetchOrg(slug);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const name = (org as any)?.name;
  return { title: name ? `${name} – Skjer det noe?` : "Skjer det noe?" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function activityToListing(row: any, orgName: string): Listing {
  return {
    id: row.id,
    kind: "activity",
    title: row.title,
    slug: row.slug,
    description: row.description,
    organizationName: orgName,
    categorySlug: row.categories?.slug ?? null,
    municipalityName: row.municipalities?.name ?? null,
    address: row.address,
    lat: 0,
    lng: 0,
    ageMin: row.age_min,
    ageMax: row.age_max,
    price: row.price,
    url: row.url,
    imageUrl: row.image_url,
    distanceM: 0,
    weekday: row.weekday,
    startTime: row.start_time,
    endTime: row.end_time,
    recurrenceNote: row.recurrence_note,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function eventToListing(row: any, orgName: string): Listing {
  return {
    id: row.id,
    kind: "event",
    title: row.title,
    slug: row.slug,
    description: row.description,
    organizationName: orgName,
    categorySlug: row.categories?.slug ?? null,
    municipalityName: row.municipalities?.name ?? null,
    address: row.address,
    lat: 0,
    lng: 0,
    ageMin: row.age_min,
    ageMax: row.age_max,
    price: row.price,
    url: row.url,
    imageUrl: row.image_url,
    distanceM: 0,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

const LISTING_SELECT =
  "id,title,slug,description,address,price,age_min,age_max,url,image_url,categories(slug),municipalities(name)";

export default async function OrganisationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await fetchOrg(slug);
  if (!org) notFound();

  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const [actRes, evtRes] = await Promise.all([
    supabase
      .from("activities")
      .select(`${LISTING_SELECT},weekday,start_time,end_time,recurrence_note`)
      .eq("organization_id", org.id)
      .eq("status", "published")
      .order("title"),
    supabase
      .from("events")
      .select(`${LISTING_SELECT},starts_at,ends_at`)
      .eq("organization_id", org.id)
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at"),
  ]);

  const activities = ((actRes.data as unknown[]) ?? []).map((r) => activityToListing(r, org.name));
  const events = ((evtRes.data as unknown[]) ?? []).map((r) => eventToListing(r, org.name));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const municipalities: string[] = ((org as any).organization_municipalities ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((om: any) => om.municipalities?.name)
    .filter(Boolean);

  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <header className="mb-8">
        <h1 style={{ margin: "0 0 8px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>{org.name}</h1>
        {municipalities.length > 0 && (
          <p style={{ margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
            <Icon name="map-pin" size={15} />
            {municipalities.join(", ")}
          </p>
        )}
        {org.description && (
          <p style={{ margin: "0 0 12px", maxWidth: "var(--content-measure)", lineHeight: 1.6, color: "var(--text-body)" }}>
            {org.description}
          </p>
        )}
        {org.website && (
          <a href={org.website} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontWeight: 600, fontSize: "var(--fs-sm)" }}>
            <Icon name="arrow-right" size={15} />
            {t.detail.website}
          </a>
        )}
      </header>

      <Section title={t.orgpage.activities} listings={activities} empty={t.orgpage.empty} />
      <div className="h-8" />
      <Section title={t.orgpage.events} listings={events} empty={t.orgpage.empty} />
    </main>
  );
}

function Section({ title, listings, empty }: { title: string; listings: Listing[]; empty: string }) {
  return (
    <section>
      <h2 style={{ margin: "0 0 12px", fontSize: "var(--fs-h3)", fontWeight: 700 }}>{title}</h2>
      {listings.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{empty}</p>
      ) : (
        <div className="sdn-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} showDistance={false} />
          ))}
        </div>
      )}
    </section>
  );
}
