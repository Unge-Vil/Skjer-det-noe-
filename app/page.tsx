import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_CENTER,
  fetchNearbyListings,
} from "@/lib/listings";
import type { Category, Listing } from "@/lib/types";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { fetchOrganisations, type OrgSummary } from "@/lib/organisations";
import { Wordmark } from "@/components/ds/Wordmark";
import { Icon } from "@/components/ds/Icon";
import { LandingHero } from "@/components/LandingHero";
import { LandingSections } from "@/components/LandingSections";
import { OrganisationCard } from "@/components/OrganisationCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  let categories: Category[] = [];
  let events: Listing[] = [];
  let activities: Listing[] = [];
  let organisations: OrgSummary[] = [];

  if (configured) {
    try {
      const supabase = await createClient();
      const [catRes, listings, orgs] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        fetchNearbyListings(supabase, {
          lat: DEFAULT_CENTER.lat,
          lng: DEFAULT_CENTER.lng,
          radiusM: 50000,
        }),
        fetchOrganisations(supabase, 4),
      ]);
      categories = (catRes.data as Category[]) ?? [];
      events = listings.filter((l) => l.kind === "event").slice(0, 3);
      activities = listings.filter((l) => l.kind === "activity").slice(0, 6);
      organisations = orgs;
    } catch (err) {
      console.error("Landing data load failed", err);
    }
  }

  return (
    <main id="main" className="flex flex-1 flex-col pb-12">
      {/* Hero */}
      <section style={{ background: "linear-gradient(180deg, var(--surface-brand-soft), var(--bg-app))" }}>
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:py-16">
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "var(--fs-sm)",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}
          >
            {t.hero.eyebrowNear}
          </p>
          <h1
            style={{
              margin: "0 0 14px",
              fontSize: "var(--fs-display-lg)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
            }}
          >
            Skjer det noe<span style={{ color: "var(--accent)" }}>?</span>
          </h1>
          <p
            style={{
              margin: "0 auto 24px",
              maxWidth: 560,
              fontSize: "var(--fs-body-lg)",
              color: "var(--text-body)",
              lineHeight: 1.5,
            }}
          >
            {t.hero.tagline}
          </p>
          <LandingHero categories={categories} />
        </div>
      </section>

      <LandingSections events={events} activities={activities} />

      {/* Organisations band */}
      {organisations.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 style={{ margin: 0, fontSize: "var(--fs-h2)", fontWeight: 800, letterSpacing: "-0.01em" }}>
                {t.landing.organisations}
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>
                {t.landing.organisationsSub}
              </p>
            </div>
            <Link
              href="/organisasjoner"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-brand)", textDecoration: "none" }}
            >
              {t.landing.allOrganisations} <Icon name="arrow-right" size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {organisations.map((o) => (
              <OrganisationCard
                key={o.id}
                name={o.name}
                href={`/organisasjon/${o.slug}`}
                place={o.municipalityName}
                countLabel={
                  o.activityCount > 0 ? fmt(t.landing.activityCount, { count: o.activityCount }) : null
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* For municipalities / organisations CTA */}
      <section className="mx-auto mt-10 w-full max-w-6xl px-4">
        <div
          className="flex flex-wrap items-center justify-between gap-6"
          style={{ padding: "32px 36px", background: "var(--fjord-800)", borderRadius: "var(--radius-2xl)" }}
        >
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ margin: "0 0 8px", color: "#fff", fontSize: "var(--fs-h2)", fontWeight: 800 }}>
              {t.cta.title}
            </h2>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: "var(--fs-body)", lineHeight: 1.5 }}>
              {t.cta.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/logg-inn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "var(--tap-comfy)",
                padding: "0 20px",
                borderRadius: "var(--radius-md)",
                background: "var(--coral-600)",
                color: "#fff",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {t.cta.forMunicipalities}
            </Link>
            <Link
              href="/logg-inn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "var(--tap-comfy)",
                padding: "0 20px",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid rgba(255,255,255,0.4)",
                color: "#fff",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {t.cta.forOrganisations}
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-10 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
        <Wordmark size={18} />
        <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          {t.footer.tagline}
        </span>
      </footer>
    </main>
  );
}
