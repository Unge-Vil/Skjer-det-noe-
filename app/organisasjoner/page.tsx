import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { plural } from "@/lib/i18n/config";
import { fetchOrganisations, type OrgSummary } from "@/lib/organisations";
import { OrganisationCard } from "@/components/OrganisationCard";

export const dynamic = "force-dynamic";

export default async function OrganisationsPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  let organisations: OrgSummary[] = [];
  if (configured) {
    try {
      const supabase = await createClient();
      organisations = await fetchOrganisations(supabase);
    } catch (err) {
      console.error("Organisations load failed", err);
    }
  }

  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 style={{ margin: "0 0 4px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>
        {t.landing.organisations}
      </h1>
      <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>
        {t.landing.organisationsSub}
      </p>

      {organisations.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.landing.empty}</p>
      ) : (
        <div className="sdn-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {organisations.map((o) => (
            <OrganisationCard
              key={o.id}
              name={o.name}
              href={`/organisasjon/${o.slug}`}
              place={o.municipalityName}
              countLabel={
                o.activityCount > 0
                  ? plural(locale, o.activityCount, t.landing.activityCount)
                  : null
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
