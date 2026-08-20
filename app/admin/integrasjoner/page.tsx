import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { IntegrationNav } from "@/components/admin/IntegrationNav";
import { orgAdminNav } from "@/components/admin/orgAdminNav";
import { Icon, type IconName } from "@/components/ds/Icon";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const org = await getMyOrg();
  if (!org) redirect("/admin");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const cards: { href: string; icon: IconName; title: string; body: string; status?: string }[] = [
      { href: "/admin/integrasjoner/api", icon: "key", title: "API", body: t.integrations.apiHint },
      { href: "/admin/integrasjoner/kalender", icon: "calendar-days", title: "Kalender-feeds", body: t.integrations.feedsHint },
      { href: "/admin/integrasjoner/embeds", icon: "monitor", title: "Innebygging", body: "Widgets for egen nettside og infoskjerm." },
      { href: "/admin/integrasjoner/mcp", icon: "sparkles", title: t.integrations.mcpTitle, body: "Utforsk offentlig katalogdata fra AI-verktøy via MCP-preview.", status: "Preview" },
    ];


  return <AdminShell title={t.integrations.title} identity={<ContextSwitcher />} nav={orgAdminNav(t)}>
      <main id="main" className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
        <IntegrationNav />
        <div style={{ marginBottom: 24 }}><h1 style={{ margin: "0 0 6px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.integrations.title}</h1><p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.integrations.subtitle}</p></div>
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => <Link key={card.href} href={card.href} style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 190, padding: 20, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", color: "inherit", textDecoration: "none" }}><Icon name={card.icon} size={24} color="var(--fjord-600)" /><div><h2 style={{ margin: "0 0 6px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{card.title}</h2><p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>{card.body}</p></div>{card.status && <span style={{ alignSelf: "flex-start", marginTop: "auto", padding: "5px 9px", borderRadius: "var(--radius-pill)", background: "var(--surface-brand-soft)", color: "var(--text-brand)", fontSize: "var(--fs-xs)", fontWeight: 700 }}>{card.status}</span>}</Link>)}
        </div>
      </main>
    </AdminShell>;
}
