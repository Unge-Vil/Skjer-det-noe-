import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getActiveMunicipality } from "@/lib/kommune";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { kommuneNav } from "@/components/admin/kommuneNav";
import { MunicipalityIntegrationNav } from "@/components/admin/MunicipalityIntegrationNav";
import { Icon } from "@/components/ds/Icon";
import { MunicipalityApiKeysManager, type MunicipalityApiKeyRow } from "@/components/admin/MunicipalityApiKeysManager";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MunicipalityApiIntegrationPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const active = await getActiveMunicipality();
  if (!active) redirect("/kommune");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const { data } = await (await createClient())
    .from("municipality_api_keys")
    .select("id,label,key_prefix,created_at,last_used_at,revoked_at")
    .eq("municipality_id", active.id)
    .order("created_at", { ascending: false });

  return (
    <AdminShell
      title="API"
      identity={<ContextSwitcher />}
      nav={kommuneNav(t, "/kommune/integrasjoner")}
    >
      <main id="main" className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
        <MunicipalityIntegrationNav />
        <div style={{ maxWidth: 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Icon name="key" size={24} color="var(--icon-brand)" />
            <h1 style={{ margin: 0, fontSize: "var(--fs-h2)", fontWeight: 800 }}>API</h1>
          </div>
          <p style={{ margin: "0 0 20px", lineHeight: 1.6, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>Bruk Kommune-API for å hente publiserte aktiviteter og arrangementer fra kommunen i egne tjenester.</p>
          <Link href="https://unge-vil.gitbook.io/skjer-det-noe/api-reference/kommune-api" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18, padding: "14px 16px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", color: "var(--text-body)", textDecoration: "none" }}>
            <span style={{ flex: "1 1 220px" }}><strong style={{ display: "block", marginBottom: 3 }}>Kommune-API-dokumentasjon</strong><span style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>Endpoint, parametere og autentisering med `sdn_muni_`-nøkkel.</span></span>
            <span style={{ color: "var(--text-link)", fontWeight: 700, fontSize: "var(--fs-sm)", whiteSpace: "nowrap" }}>Åpne dokumentasjon →</span>
          </Link>
          <MunicipalityApiKeysManager municipalityId={active.id} initial={(data as MunicipalityApiKeyRow[]) ?? []} />
        </div>
      </main>
    </AdminShell>
  );
}
