import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getActiveMunicipality } from "@/lib/kommune";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon, type IconName } from "@/components/ds/Icon";
import { LogoutButton } from "@/components/LogoutButton";
import { OrgStatusButton } from "@/components/admin/OrgStatusButton";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { kommuneNav } from "@/components/admin/kommuneNav";
import { getMunicipalityAnalytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

type Org = {
  id: string;
  name: string;
  status: string;
  org_number: string | null;
  is_volunteer: boolean;
};

const cardStyle = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export default async function KommunePage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  // Platform admins do not auto-enter municipalities they don't specifically
  // administer — municipality work requires municipality-admin access.
  const active = await getActiveMunicipality();
  if (!active) {
    return (
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 800 }}>{t.kommune.title}</h1>
          <LogoutButton />
        </div>
        <div style={cardStyle}>
          <p style={{ margin: 0, color: "var(--text-body)" }}>{t.kommune.noAccess}</p>
        </div>
      </main>
    );
  }

  // Everything on the dashboard is scoped to the active municipality (chosen in
  // the context switcher) — the same one the profile/pages screens act on.
  const [omRes, actCount, evtCount, pageCount] = await Promise.all([
    supabase
      .from("organization_municipalities")
      .select("organizations(id,name,status,org_number,is_volunteer)")
      .eq("municipality_id", active.id),
    supabase.from("activities").select("id", { count: "exact", head: true }).eq("municipality_id", active.id),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("municipality_id", active.id),
    supabase
      .from("municipality_pages")
      .select("id", { count: "exact", head: true })
      .eq("municipality_id", active.id)
      .eq("status", "published"),
  ]);
  const analytics = await getMunicipalityAnalytics(active.id);

  const byId = new Map<string, Org>();
  for (const row of omRes.data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = (row as any).organizations as Org | null;
    if (o) byId.set(o.id, o);
  }

  const orgs = [...byId.values()];
  const pending = orgs.filter((o) => o.status === "draft");
  const approved = orgs.filter((o) => o.status === "published");

  const nav = kommuneNav(t, "/kommune");

  return (
    <AdminShell
      title={t.kommune.title}
      identity={<ContextSwitcher />}
      nav={nav}
    >
      <div className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
            {t.kommune.subtitle}
          </p>
          <a
            href={`/kommune/${active.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontWeight: 600, fontSize: "var(--fs-sm)" }}
          >
            <Icon name="external-link" size={15} />
            {t.kommune.viewPublic}
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" style={{ marginBottom: 28 }}>
          <MiniStat icon="clipboard-list" value={pending.length} label={t.kommune.statPending} />
          <MiniStat icon="building-2" value={approved.length} label={t.kommune.statApproved} />
          <MiniStat icon="repeat" value={actCount.count ?? 0} label={t.kommune.statActivities} />
          <MiniStat icon="calendar-days" value={evtCount.count ?? 0} label={t.kommune.statEvents} />
          <MiniStat icon="file-text" value={pageCount.count ?? 0} label={t.kommune.statPages} />
        </div>

        <section style={{ ...cardStyle, marginBottom: 28 }} aria-labelledby="municipality-analytics-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="municipality-analytics-title" style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.kommune.analyticsTitle}</h2>
              <p style={{ margin: "4px 0 16px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.kommune.analyticsSubtitle}</p>
            </div>
            <Icon name="eye" size={22} color="var(--icon-brand)" />
          </div>
          {analytics ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MiniStat icon="eye" value={analytics.total_views} label={t.kommune.analyticsTotal} />
              <MiniStat icon="building-2" value={analytics.organization_views} label={t.kommune.analyticsOrganizations} />
              <MiniStat icon="repeat" value={analytics.activity_views} label={t.kommune.analyticsActivities} />
              <MiniStat icon="calendar-days" value={analytics.event_views} label={t.kommune.analyticsEvents} />
            </div>
          ) : (
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.kommune.analyticsUnavailable}</p>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section style={cardStyle}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Icon name="building-2" size={22} color="var(--icon-brand)" />
                <h2 style={{ margin: "12px 0 4px", fontSize: "var(--fs-h3)", fontWeight: 700 }}>{approved.length}</h2>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.kommune.statApproved}</p>
              </div>
              <Link href="/kommune/organisasjoner" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontWeight: 700, fontSize: "var(--fs-sm)", textDecoration: "none" }}>
                {t.kommune.showAllOrganizations}
                <Icon name="arrow-right" size={15} />
              </Link>
            </div>
          </section>
          <PendingPreview orgs={pending} t={t} />
        </div>
      </div>
    </AdminShell>
  );
}

function MiniStat({ icon, value, label }: { icon: IconName; value: number | string; label: string }) {
  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <Icon name={icon} size={20} color="var(--icon-brand)" />
      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>{value}</div>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function PendingPreview({
  orgs,
  t,
}: {
  orgs: Org[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <section style={cardStyle}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.kommune.pending}</h2>
          <p style={{ margin: "4px 0 16px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{orgs.length} {t.kommune.organizationCount}</p>
        </div>
        <Icon name="clipboard-list" size={22} color="var(--icon-brand)" />
      </div>
      {orgs.length === 0 ? (
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.kommune.noPending}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {orgs.slice(0, 5).map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 10 }}>
              <div className="min-w-0">
                <p style={{ margin: 0, fontWeight: 600 }}>{o.name}</p>
                {o.org_number && <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{t.kommune.orgNumber}: {o.org_number}</p>}
              </div>
              <OrgStatusButton id={o.id} status={o.status} />
            </div>
          ))}
          {orgs.length > 5 && (
            <Link href="/kommune/organisasjoner?status=draft" style={{ color: "var(--text-link)", fontSize: "var(--fs-sm)", fontWeight: 700, textDecoration: "none" }}>
              {t.kommune.showAllOrganizations}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
