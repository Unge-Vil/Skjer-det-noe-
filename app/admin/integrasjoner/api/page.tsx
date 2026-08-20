import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { ApiKeysManager, type ApiKeyRow } from "@/components/admin/ApiKeysManager";
import { IntegrationNav } from "@/components/admin/IntegrationNav";
import { orgAdminNav } from "@/components/admin/orgAdminNav";

export const dynamic = "force-dynamic";

export default async function ApiIntegrationPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const org = await getMyOrg();
  if (!org) redirect("/admin");
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { data } = await (await createClient()).from("api_keys").select("id,label,key_prefix,auto_publish,created_at,last_used_at,revoked_at").eq("organization_id", org.id).order("created_at", { ascending: false });

  return <AdminShell title="API" identity={<ContextSwitcher />} nav={orgAdminNav(t)}>
    <main id="main" className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
      <IntegrationNav />
      <div style={{ marginBottom: 20 }}><h1 style={{ margin: "0 0 6px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>API</h1><p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.integrations.apiHint}</p></div>
      <Link href="https://unge-vil.gitbook.io/skjer-det-noe/api-reference/" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18, padding: "14px 16px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", color: "var(--text-body)", textDecoration: "none" }}>
        <span style={{ flex: "1 1 220px" }}><strong style={{ display: "block", marginBottom: 3 }}>{t.integrations.docsTitle}</strong><span style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.integrations.docsIntro}</span></span>
        <span style={{ color: "var(--text-link)", fontWeight: 700, fontSize: "var(--fs-sm)", whiteSpace: "nowrap" }}>Åpne dokumentasjon →</span>
      </Link>
      <ApiKeysManager orgId={org.id} initial={(data as ApiKeyRow[]) ?? []} />
    </main>
  </AdminShell>;
}
