import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon, type IconName } from "@/components/ds/Icon";
import { AdminShell, type NavItem } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { MuniAdminManager } from "@/components/admin/MuniAdminManager";

export const dynamic = "force-dynamic";

type AdminRow = {
  municipality_id: string;
  municipality_name: string;
  user_id: string;
  email: string;
};

const cardStyle = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export default async function PlatformMunicipalityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        <div style={cardStyle}>
          <p style={{ margin: 0 }}>{t.platform.noAccess}</p>
        </div>
      </main>
    );
  }

  const { data: muni } = await supabase
    .from("municipalities")
    .select("id,name,slug,kommunenummer,county")
    .eq("id", id)
    .maybeSingle();
  if (!muni) notFound();

  const [orgCount, actCount, evtCount, pageCount, adminRes] = await Promise.all([
    supabase.from("organization_municipalities").select("organization_id", { count: "exact", head: true }).eq("municipality_id", id),
    supabase.from("activities").select("id", { count: "exact", head: true }).eq("municipality_id", id),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("municipality_id", id),
    supabase.from("municipality_pages").select("id", { count: "exact", head: true }).eq("municipality_id", id),
    supabase.rpc("list_municipality_admins"),
  ]);

  const admins = ((adminRes.data as AdminRow[]) ?? []).filter((a) => a.municipality_id === id);

  const nav: NavItem[] = [
    { href: "/plattform", label: t.orgadmin.overview, icon: "layout-dashboard" },
  ];

  return (
    <AdminShell title={muni.name} identity={<ContextSwitcher />} nav={nav}>
      <div className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/plattform" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontWeight: 600, fontSize: "var(--fs-sm)" }}>
            <Icon name="arrow-left" size={15} />
            {t.platform.backToPlatform}
          </Link>
          <a
            href={`/kommune/${muni.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontWeight: 600, fontSize: "var(--fs-sm)" }}
          >
            <Icon name="external-link" size={15} />
            {t.kommune.viewPublic}
          </a>
        </div>

        <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          {muni.county ? `${muni.county} · ` : ""}{t.platform.muniNumber} {muni.kommunenummer}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ marginBottom: 28 }}>
          <MiniStat icon="building-2" value={orgCount.count ?? 0} label={t.platform.muniStatsOrgs} />
          <MiniStat icon="repeat" value={actCount.count ?? 0} label={t.platform.muniStatsActivities} />
          <MiniStat icon="calendar-days" value={evtCount.count ?? 0} label={t.platform.muniStatsEvents} />
          <MiniStat icon="file-text" value={pageCount.count ?? 0} label={t.platform.muniStatsPages} />
        </div>

        <section>
          <h2 style={{ margin: "0 0 12px", fontSize: "var(--fs-h3)", fontWeight: 700 }}>{t.platform.muniAdminsHere}</h2>
          <MuniAdminManager municipalities={[{ id: muni.id, name: muni.name }]} admins={admins} />
        </section>
      </div>
    </AdminShell>
  );
}

function MiniStat({ icon, value, label }: { icon: IconName; value: number | string; label: string }) {
  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <Icon name={icon} size={20} color="var(--fjord-600)" />
      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>{value}</div>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}
