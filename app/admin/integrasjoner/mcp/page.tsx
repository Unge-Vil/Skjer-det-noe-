import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { IntegrationNav } from "@/components/admin/IntegrationNav";
import { orgAdminNav } from "@/components/admin/orgAdminNav";
import { Icon } from "@/components/ds/Icon";
import { McpConnectionGuide } from "@/components/admin/McpConnectionGuide";

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
      <div style={{ maxWidth: 760 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}><Icon name="sparkles" size={24} color="var(--fjord-600)" /><h1 style={{ margin: 0, fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.integrations.mcpTitle}</h1></div>
        <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>MCP-serveren lar AI-verktøy hente strukturert informasjon fra Skjer det noe? uten at de må tolke nettsider.</p>
        <McpConnectionGuide scope="organization" />
      </div>
    </main>
  </AdminShell>;
}
