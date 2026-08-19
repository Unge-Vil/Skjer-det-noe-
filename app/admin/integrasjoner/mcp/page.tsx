import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { IntegrationNav } from "@/components/admin/IntegrationNav";
import { orgAdminNav } from "@/components/admin/orgAdminNav";
import { Icon } from "@/components/ds/Icon";

export const dynamic = "force-dynamic";

export default async function McpIntegrationPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const org = await getMyOrg();
  if (!org) redirect("/admin");
  const locale = await getLocale();
  const t = getDictionary(locale);

  return <AdminShell title={t.integrations.mcpTitle} identity={<ContextSwitcher />} nav={orgAdminNav(t)}>
    <main id="main" className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
      <IntegrationNav />
      <div style={{ maxWidth: 680 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}><Icon name="sparkles" size={24} color="var(--fjord-600)" /><h1 style={{ margin: 0, fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.integrations.mcpTitle}</h1></div>
        <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.integrations.mcpHint}</p>
        <section style={{ padding: 24, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)" }}>
          <span style={{ display: "inline-flex", padding: "5px 9px", borderRadius: "var(--radius-pill)", background: "var(--surface-brand-soft)", color: "var(--text-brand)", fontSize: "var(--fs-xs)", fontWeight: 700 }}>{t.integrations.mcpComing}</span>
          <p style={{ margin: "16px 0 0", lineHeight: 1.6, color: "var(--text-body)" }}>{t.integrations.mcpComingBody}</p>
        </section>
      </div>
    </main>
  </AdminShell>;
}
