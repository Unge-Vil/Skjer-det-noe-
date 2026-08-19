import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getActiveMunicipality } from "@/lib/kommune";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { kommuneNav } from "@/components/admin/kommuneNav";
import { MunicipalityIntegrationNav } from "@/components/admin/MunicipalityIntegrationNav";
import { Icon } from "@/components/ds/Icon";

export const dynamic = "force-dynamic";

export default async function MunicipalityMcpIntegrationPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const active = await getActiveMunicipality();
  if (!active) redirect("/kommune");

  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <AdminShell
      title={t.integrations.mcpTitle}
      identity={<ContextSwitcher />}
      nav={kommuneNav(t, "/kommune/integrasjoner")}
    >
      <main id="main" className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
        <MunicipalityIntegrationNav />
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Icon name="sparkles" size={24} color="var(--fjord-600)" />
            <h1 style={{ margin: 0, fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.integrations.mcpTitle}</h1>
          </div>
          <section
            style={{
              padding: 24,
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                padding: "5px 9px",
                borderRadius: "var(--radius-pill)",
                background: "var(--surface-brand-soft)",
                color: "var(--text-brand)",
                fontSize: "var(--fs-xs)",
                fontWeight: 700,
              }}
            >
              {t.integrations.mcpComing}
            </span>
            <p style={{ margin: "16px 0 0", lineHeight: 1.6, color: "var(--text-body)" }}>
              MCP-integrasjon for kommuneadmin kommer snart.
            </p>
          </section>
        </div>
      </main>
    </AdminShell>
  );
}
