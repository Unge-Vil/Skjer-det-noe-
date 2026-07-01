import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { loc, type Locale } from "@/lib/i18n/config";
import type { Listing } from "@/lib/types";
import { Icon } from "@/components/ds/Icon";
import { ListingCard } from "@/components/ListingCard";
import { SocialLinksBar } from "@/components/SocialLinksBar";
import { RichTextContent } from "@/components/RichTextContent";
import { isEmptyDoc } from "@/lib/tiptap";

export const dynamic = "force-dynamic";

async function fetchOrg(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select(
      "id,name,description,description_en,description_doc,description_doc_en,website,address,logo_url,banner_url,social_links,org_profiles(name,slug)",
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
function activityToListing(row: any, orgName: string, locale: Locale): Listing {
  return {
    id: row.id,
    kind: "activity",
    title: loc(locale, row.title, row.title_en) ?? row.title,
    slug: row.slug,
    description: loc(locale, row.description, row.description_en),
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
function eventToListing(row: any, orgName: string, locale: Locale): Listing {
  return {
    id: row.id,
    kind: "event",
    title: loc(locale, row.title, row.title_en) ?? row.title,
    slug: row.slug,
    description: loc(locale, row.description, row.description_en),
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
  "id,title,title_en,slug,description,description_en,address,price,age_min,age_max,url,image_url,categories(slug),municipalities(name)";

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
  await supabase.rpc("log_view", { p_type: "organization", p_id: org.id });

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

  const { data: dirData } = await supabase
    .from("directory_listings")
    .select("id,kind,title,title_en,slug")
    .eq("organization_id", org.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dir = ((dirData as any[]) ?? []).map((r) => ({ id: r.id, kind: r.kind as string, title: loc(locale, r.title, r.title_en) ?? r.title, slug: r.slug as string }));
  const services = dir.filter((d) => d.kind === "service");
  const volunteers = dir.filter((d) => d.kind === "volunteer");

  const activities = ((actRes.data as unknown[]) ?? []).map((r) => activityToListing(r, org.name, locale));
  const events = ((evtRes.data as unknown[]) ?? []).map((r) => eventToListing(r, org.name, locale));
  const orgDescription = loc(locale, org.description, org.description_en);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orgAny = org as any;
  const descDoc =
    locale === "en" && !isEmptyDoc(orgAny.description_doc_en)
      ? orgAny.description_doc_en
      : orgAny.description_doc;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profiles: { name: string; slug: string }[] = ((org as any).org_profiles ?? [])
    .filter((p: unknown): p is { name: string; slug: string } => Boolean(p))
    .map((p: { name: string; slug: string }) => ({ name: p.name, slug: p.slug }));

  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <header className="mb-8">
        {org.banner_url && (
          <div style={{ position: "relative", aspectRatio: "4 / 1", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 16, background: "var(--fjord-100)" }}>
            <Image src={org.banner_url} alt="" fill style={{ objectFit: "cover" }} sizes="1100px" />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          {org.logo_url && (
            <span style={{ display: "inline-flex", width: 56, height: 56, flex: "none", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-subtle)", position: "relative", background: "var(--surface-card)" }}>
              <Image src={org.logo_url} alt="" fill style={{ objectFit: "cover" }} sizes="56px" />
            </span>
          )}
          <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 800 }}>{org.name}</h1>
        </div>
        {profiles.length > 0 && (
          <p style={{ margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
            <Icon name="map-pin" size={15} />
            {profiles.map((m) => (
              <a
                key={m.slug}
                href={`/organisasjon/${slug}/${m.slug}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 10px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-link)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {m.name}
              </a>
            ))}
          </p>
        )}
        {!isEmptyDoc(descDoc) ? (
          <div style={{ maxWidth: "var(--content-measure)", marginBottom: 12 }}>
            <RichTextContent doc={descDoc} />
          </div>
        ) : (
          orgDescription && (
            <p style={{ margin: "0 0 12px", maxWidth: "var(--content-measure)", lineHeight: 1.6, color: "var(--text-body)" }}>
              {orgDescription}
            </p>
          )
        )}
        {org.website && (
          <a href={org.website} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontWeight: 600, fontSize: "var(--fs-sm)" }}>
            <Icon name="arrow-right" size={15} />
            {t.detail.website}
          </a>
        )}
        <div style={{ marginTop: 16 }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <SocialLinksBar links={(org as any).social_links} />
        </div>
      </header>

      <Section title={t.orgpage.activities} listings={activities} empty={t.orgpage.empty} />
      <div className="h-8" />
      <Section title={t.orgpage.events} listings={events} empty={t.orgpage.empty} />
      {services.length > 0 && (
        <>
          <div className="h-8" />
          <DirectoryLinks title={t.directory.services} base="/tjeneste" items={services} />
        </>
      )}
      {volunteers.length > 0 && (
        <>
          <div className="h-8" />
          <DirectoryLinks title={t.directory.volunteer} base="/frivillig" items={volunteers} />
        </>
      )}
    </main>
  );
}

function DirectoryLinks({ title, base, items }: { title: string; base: string; items: { id: string; title: string; slug: string }[] }) {
  return (
    <section>
      <h2 style={{ margin: "0 0 12px", fontSize: "var(--fs-h3)", fontWeight: 700 }}>{title}</h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <li key={it.id}>
            <a href={`${base}/${it.slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-link)", fontWeight: 600 }}>
              <Icon name="arrow-right" size={15} />
              {it.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
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
