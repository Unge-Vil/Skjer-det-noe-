import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon } from "@/components/ds/Icon";
import { LogoutButton } from "@/components/LogoutButton";
import { OrgStatusButton } from "@/components/admin/OrgStatusButton";
import { MuniCreateForm } from "@/components/admin/MuniCreateForm";
import { AdminShell, type NavItem } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { platformNav } from "@/components/admin/platformNav";

export const dynamic = "force-dynamic";

type Org = { id: string; name: string; status: string };
type Muni = { id: string; name: string };

const cardStyle = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export default async function PlatformPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_platform_admin) {
    return (
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 800 }}>{t.platform.title}</h1>
          <LogoutButton />
        </div>
        <div style={cardStyle}>
          <p style={{ margin: 0 }}>{t.platform.noAccess}</p>
        </div>
      </main>
    );
  }

  const [orgRes, muniRes] = await Promise.all([
    supabase.from("organizations").select("id,name,status").order("status").order("name"),
    supabase.from("municipalities_view").select("id,name").order("name"),
  ]);

  const orgs = (orgRes.data as Org[]) ?? [];
  const municipalities = (muniRes.data as Muni[]) ?? [];

  const statusText = (s: string) =>
    s === "published" ? t.admin.statusPublished : s === "archived" ? t.admin.statusArchived : t.admin.statusDraft;

  return (
    <AdminShell
      title={t.platform.title}
      identity={<ContextSwitcher />}
      nav={platformNav(t)}
    >
      <div className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
      <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
        {t.platform.subtitle}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ marginBottom: 28 }}>
        <MiniStat icon="map" value={municipalities.length} label={t.platform.municipalities} />
        <MiniStat icon="building-2" value={orgs.length} label={t.platform.allOrgs} />
        <MiniStat icon="clock" value={orgs.filter((o) => o.status === "draft").length} label={t.admin.statusDraft} />
        <MiniStat icon="check-circle-2" value={orgs.filter((o) => o.status === "published").length} label={t.admin.statusPublished} />
      </div>

      <section id="kommuner" className="mb-10">
        <h2 style={{ margin: "0 0 12px", fontSize: "var(--fs-h3)", fontWeight: 700 }}>{t.platform.createMuni}</h2>
        <div style={cardStyle}>
          <MuniCreateForm />
        </div>
      </section>

      <section className="mb-10">
        <h2 style={{ margin: "0 0 12px", fontSize: "var(--fs-h3)", fontWeight: 700 }}>{t.platform.municipalities}</h2>
        {municipalities.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>—</p>
        ) : (
          <div className="flex flex-col gap-2">
            {municipalities.map((m) => (
              <Link
                key={m.id}
                href={`/plattform/kommune/${m.id}`}
                className="flex items-center justify-between gap-3"
                style={{ ...cardStyle, padding: "12px 16px", textDecoration: "none", color: "var(--text-body)" }}
              >
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontSize: "var(--fs-sm)", fontWeight: 600 }}>
                  {t.platform.manageMuni}
                  <Icon name="arrow-right" size={15} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section id="organisasjoner">
        <h2 style={{ margin: "0 0 12px", fontSize: "var(--fs-h3)", fontWeight: 700 }}>{t.platform.allOrgs}</h2>
        <div className="flex flex-col gap-2">
          {orgs.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3" style={{ ...cardStyle, padding: "12px 16px" }}>
              <div className="min-w-0">
                <p style={{ margin: 0, fontWeight: 600 }}>{o.name}</p>
                <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{statusText(o.status)}</p>
              </div>
              <OrgStatusButton id={o.id} status={o.status} />
            </div>
          ))}
        </div>
      </section>
      </div>
    </AdminShell>
  );
}

function MiniStat({ icon, value, label }: { icon: NavItem["icon"]; value: number | string; label: string }) {
  return <div style={{ ...cardStyle, padding: 16 }}><Icon name={icon} size={20} color="var(--fjord-600)" /><div style={{ marginTop: 8, fontSize: 24, fontWeight: 800 }}>{value}</div><div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{label}</div></div>;
}
