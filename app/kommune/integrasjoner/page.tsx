import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getActiveMunicipality } from "@/lib/kommune";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { kommuneNav } from "@/components/admin/kommuneNav";
import { MunicipalityIntegrationNav } from "@/components/admin/MunicipalityIntegrationNav";
import { Icon, type IconName } from "@/components/ds/Icon";

export const dynamic = "force-dynamic";

export default async function MunicipalityIntegrationsPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const active = await getActiveMunicipality();
  if (!active) redirect("/kommune");

  const locale = await getLocale();
  const t = getDictionary(locale);

  const cards: { href: string; icon: IconName; title: string; body: string; status?: string }[] = [
    {
      href: "/kommune/integrasjoner/api",
      icon: "key",
      title: "API",
      body: "Kommune-API for automatisering og integrasjoner.",
      status: t.integrations.mcpComing,
    },
    {
      href: "/kommune/integrasjoner/mcp",
      icon: "sparkles",
      title: t.integrations.mcpTitle,
      body: "Koble AI-verktøy til kommunens innhold på en kontrollert måte.",
      status: t.integrations.mcpComing,
    },
  ];

  return (
    <AdminShell
      title={t.orgadmin.integrations}
      identity={<ContextSwitcher />}
      nav={kommuneNav(t, "/kommune/integrasjoner")}
    >
      <main id="main" className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
        <MunicipalityIntegrationNav />
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.orgadmin.integrations}</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
            Velg en integrasjon for kommunen. Flere funksjoner kommer snart.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                minHeight: 170,
                padding: 20,
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <Icon name={card.icon} size={24} color="var(--fjord-600)" />
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{card.title}</h2>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>
                  {card.body}
                </p>
              </div>
              {card.status && (
                <span
                  style={{
                    alignSelf: "flex-start",
                    marginTop: "auto",
                    padding: "5px 9px",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--surface-brand-soft)",
                    color: "var(--text-brand)",
                    fontSize: "var(--fs-xs)",
                    fontWeight: 700,
                  }}
                >
                  {card.status}
                </span>
              )}
            </Link>
          ))}
        </div>
      </main>
    </AdminShell>
  );
}
