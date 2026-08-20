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
import { absoluteUrl, jsonLd, listingMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function fetchProfile(orgSlug: string, profileSlug: string) {
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id,name,description,description_en,description_doc,description_doc_en,website,address,logo_url,banner_url,social_links")
    .eq("slug", orgSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!org) return null;

  const { data: override } = await supabase
    .from("org_profiles")
    .select("id,name,description,description_en,description_doc,description_doc_en,website,address,logo_url,banner_url,social_links")
    .eq("organization_id", org.id)
    .eq("slug", profileSlug)
    .maybeSingle();
  if (!override) return null; // no such profile under this org

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pick = (k: string) => ((override as any)[k] ?? (org as any)[k]) ?? null;
  return {
    org,
    profile: { id: override.id as string, name: override.name as string },
    eff: {
      description: pick("description"),
      description_en: pick("description_en"),
      description_doc: pick("description_doc"),
      description_doc_en: pick("description_doc_en"),
      website: pick("website"),
      address: pick("address"),
      logo_url: pick("logo_url"),
      banner_url: pick("banner_url"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      social_links: (override as any).social_links ?? (org as any).social_links,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; profil: string }>;
}): Promise<Metadata> {
  const { slug, profil } = await params;
  const data = await fetchProfile(slug, profil);
  if (!data) return { title: "Skjer det noe?" };
  return listingMetadata({
    title: `${data.org.name} - ${data.profile.name}`,
    description: data.eff.description,
    imageUrl: data.eff.banner_url ?? data.eff.logo_url,
    pathname: `/organisasjon/${slug}/${profil}`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toListing(row: any, kind: "activity" | "event", orgName: string, locale: Locale): Listing {
  return {
    id: row.id,
    kind,
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
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

const LISTING_SELECT =
  "id,title,title_en,slug,description,description_en,address,price,age_min,age_max,url,image_url,categories(slug),municipalities(name)";

export default async function DepartmentPublicPage({
  params,
}: {
  params: Promise<{ slug: string; profil: string }>;
}) {
  const { slug, profil } = await params;
  const data = await fetchProfile(slug, profil);
  if (!data) notFound();

  const locale = await getLocale();
  const t = getDictionary(locale);
  const { org, profile, eff } = data;
  const supabase = await createClient();

  const [actRes, evtRes] = await Promise.all([
    supabase
      .from("activities")
      .select(`${LISTING_SELECT},weekday,start_time,end_time,recurrence_note`)
      .eq("profile_id", profile.id)
      .eq("status", "published")
      .order("title"),
    supabase
      .from("events")
      .select(`${LISTING_SELECT},starts_at,ends_at`)
      .eq("profile_id", profile.id)
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at"),
  ]);

  const activities = ((actRes.data as unknown[]) ?? []).map((r) => toListing(r, "activity", org.name, locale));
  const events = ((evtRes.data as unknown[]) ?? []).map((r) => toListing(r, "event", org.name, locale));
  const description = loc(locale, eff.description, eff.description_en);
  const descDoc =
    locale === "en" && !isEmptyDoc(eff.description_doc_en) ? eff.description_doc_en : eff.description_doc;
  const canonical = absoluteUrl(`/organisasjon/${slug}/${profil}`);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: `${org.name} - ${profile.name}`,
            url: canonical,
            description: description ?? undefined,
            logo: eff.logo_url ?? undefined,
            image: eff.banner_url ?? eff.logo_url ?? undefined,
            address: eff.address ?? undefined,
          }),
        }}
      />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <header className="mb-8">
        {eff.banner_url && (
          <div style={{ position: "relative", aspectRatio: "4 / 1", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 16, background: "var(--fjord-100)" }}>
            <Image src={eff.banner_url} alt="" fill style={{ objectFit: "cover" }} sizes="1100px" />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          {eff.logo_url && (
            <span style={{ display: "inline-flex", width: 56, height: 56, flex: "none", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-subtle)", position: "relative", background: "var(--surface-card)" }}>
              <Image src={eff.logo_url} alt="" fill style={{ objectFit: "cover" }} sizes="56px" />
            </span>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 800 }}>{org.name}</h1>
            <p style={{ margin: "2px 0 0", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
              <Icon name="map-pin" size={15} />
              {profile.name}
            </p>
          </div>
        </div>
        {!isEmptyDoc(descDoc) ? (
          <div style={{ maxWidth: "var(--content-measure)", marginBottom: 12 }}>
            <RichTextContent doc={descDoc} />
          </div>
        ) : (
          description && (
            <p style={{ margin: "0 0 12px", maxWidth: "var(--content-measure)", lineHeight: 1.6, color: "var(--text-body)" }}>
              {description}
            </p>
          )
        )}
        {eff.website && (
          <a href={eff.website} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontWeight: 600, fontSize: "var(--fs-sm)" }}>
            <Icon name="arrow-right" size={15} />
            {t.detail.website}
          </a>
        )}
        <div style={{ marginTop: 16 }}>
          <SocialLinksBar links={eff.social_links} />
        </div>
      </header>

      <Section title={t.orgpage.activities} listings={activities} empty={t.orgpage.empty} />
      <div className="h-8" />
      <Section title={t.orgpage.events} listings={events} empty={t.orgpage.empty} />
      </main>
    </>
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
