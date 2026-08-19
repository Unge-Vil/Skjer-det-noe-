import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import type { Municipality } from "@/lib/types";
import { Icon } from "@/components/ds/Icon";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kommuner – Skjer det noe?" };

export default async function MunicipalitiesPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  let municipalities: Municipality[] = [];
  if (configured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.from("municipalities_view").select("id,name,slug,county,kommunenummer,lat,lng").order("name");
      municipalities = (data as Municipality[]) ?? [];
    } catch (err) {
      console.error("Municipality list load failed", err);
    }
  }

  return (
    <>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <header className="mb-5">
          <h1 style={{ margin: "0 0 4px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>
            {t.location.municipalityListTitle}
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>
            {t.location.municipalityListSub}
          </p>
        </header>

        {municipalities.length === 0 ? (
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
            {t.explorer.notConfigured}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {municipalities.map((municipality) => (
              <Link
                key={municipality.id}
                href={`/kommune/${municipality.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--surface-card)",
                  padding: "14px 16px",
                  textDecoration: "none",
                }}
              >
                <span>
                  <strong style={{ display: "block", color: "var(--text-strong)", fontSize: "var(--fs-body)" }}>
                    {municipality.name}
                  </strong>
                  <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-xs)" }}>
                    {municipality.county ?? t.location.municipality}
                  </span>
                </span>
                <Icon name="arrow-right" size={16} color="var(--text-muted)" />
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
