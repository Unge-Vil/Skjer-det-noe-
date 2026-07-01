import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { getMyProfiles } from "@/lib/profiles";
import { getAccessAreas } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { weekdayName, formatTimeRange, formatEventDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/nb";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { IconButton } from "@/components/ds/IconButton";
import { StatusLabel } from "@/components/ds/StatusLabel";
import { LogoutButton } from "@/components/LogoutButton";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminShell, type NavItem } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { categoryDef } from "@/components/ds/categories";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-sm)",
} as const;

function StatusBadge({ status, t }: { status: string; t: Dictionary }) {
  return status === "published" ? (
    <StatusLabel icon="check" label={t.admin.statusPublished} tone="success" size="sm" />
  ) : (
    <StatusLabel icon="clock" label={t.admin.statusDraft} tone="neutral" size="sm" />
  );
}

function Thumb({ row }: { row: Row }) {
  const cat = categoryDef(row.categories?.slug);
  return (
    <div style={{ width: 52, height: 52, flex: "none", borderRadius: "var(--radius-md)", overflow: "hidden", background: cat.bg, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {row.image_url ? (
        <Image src={row.image_url} alt="" fill style={{ objectFit: "cover" }} sizes="52px" />
      ) : (
        <Icon name={cat.icon} size={22} color={cat.fg} />
      )}
    </div>
  );
}

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const org = await getMyOrg();

  if (!org) {
    // Profile-only admins have no master org — send them to their profiles.
    const profiles = await getMyProfiles();
    if (profiles.length > 0) redirect("/admin/profiler");
    // No org at all: route municipality / platform admins to their area instead
    // of the "register organisation" dead end.
    const areas = await getAccessAreas();
    if (areas.municipality) redirect("/kommune");
    if (areas.platform) redirect("/plattform");
    return (
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 800 }}>{t.admin.title}</h1>
          <LogoutButton />
        </div>
        <div style={{ ...card, padding: 28 }}>
          <p style={{ margin: "0 0 16px", color: "var(--text-body)" }}>{t.admin.noOrg}</p>
          <Link href="/registrer"><Button leadingIcon="sparkles">{t.admin.registerOrg}</Button></Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const [actRes, evtRes] = await Promise.all([
    supabase.from("activities").select("id,title,status,image_url,weekday,start_time,end_time,recurrence_note,categories(slug)").eq("organization_id", org.id).order("created_at", { ascending: false }),
    supabase.from("events").select("id,title,status,image_url,starts_at,categories(slug)").eq("organization_id", org.id).order("starts_at", { ascending: true }),
  ]);
  const activities = (actRes.data as Row[]) ?? [];
  const events = (evtRes.data as Row[]) ?? [];
  const { data: views } = await supabase.rpc("org_view_count_30d", { p_org: org.id });

  // Profile completeness
  const fields = [
    { label: t.orgadmin.fLogo, done: !!org.logoUrl },
    { label: t.orgadmin.fDescription, done: !!org.description },
    { label: t.orgadmin.fWebsite, done: !!org.website },
    { label: t.orgadmin.fContact, done: !!(org.email || org.phone) },
    { label: t.orgadmin.fAddress, done: !!org.address },
  ];
  const pct = Math.round((fields.filter((f) => f.done).length / fields.length) * 100);

  const previewHref = `/organisasjon/${org.slug}`;
  const nav: NavItem[] = [
    { href: "/admin", label: t.orgadmin.overview, icon: "layout-dashboard" },
    { href: "/admin/profil", label: t.orgadmin.profile, icon: "building-2" },
    { href: "/admin/profiler", label: t.orgadmin.departments, icon: "building-2" },
    { href: "/admin#aktiviteter", label: t.admin.activities, icon: "repeat", badge: activities.length },
    { href: "/admin#arrangementer", label: t.admin.events, icon: "calendar-days", badge: events.length },
    { href: "/admin/bilder", label: t.orgadmin.media, icon: "image" },
    { href: "/admin/innstillinger", label: t.orgadmin.settings, icon: "settings" },
    { href: previewHref, label: t.orgadmin.preview, icon: "external-link" },
  ];

  return (
    <AdminShell
      title={t.orgadmin.overview}
      identity={<ContextSwitcher />}
      nav={nav}
      footerTop={
        <Link href="/admin/aktivitet/ny">
          <Button fullWidth leadingIcon="plus">{t.admin.newActivity}</Button>
        </Link>
      }
      headerAction={
        <a href={previewHref} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm" leadingIcon="external-link">
            {t.orgadmin.previewPublic}
          </Button>
        </a>
      }
    >
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }} className="mx-auto w-full max-w-5xl">
        {org.status === "draft" && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "var(--sol-100)", border: "1px solid var(--sol-300)", borderRadius: "var(--radius-lg)" }}>
            <Icon name="bell-ring" size={24} color="#6b4e00" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--fs-body)", fontWeight: 700, color: "#5a4200" }}>{t.admin.pendingTitle}</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "#6b4e00" }}>{t.admin.pendingBody}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.3fr]">
          {/* Completeness */}
          <section style={{ ...card, padding: 20 }}>
            <div className="mb-3 flex items-center justify-between">
              <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.orgadmin.profileTitle}</h2>
              <span style={{ fontSize: 22, fontWeight: 800, color: "var(--fjord-700)" }}>{pct}%</span>
            </div>
            <div style={{ height: 10, background: "var(--surface-sunk)", borderRadius: 999, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "var(--fjord-600)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {fields.map((f) => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--fs-sm)" }}>
                  <Icon name={f.done ? "check-circle-2" : "circle"} size={19} color={f.done ? "var(--success-text)" : "var(--stone-300)"} />
                  <span style={{ flex: 1, color: f.done ? "var(--text-body)" : "var(--text-strong)", fontWeight: f.done ? 500 : 600 }}>{f.label}</span>
                  {!f.done && <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{t.orgadmin.addField}</span>}
                </div>
              ))}
            </div>
          </section>

          {/* Stats + approval */}
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="grid grid-cols-3 gap-4">
              <MiniStat icon="repeat" value={activities.length} label={t.admin.activities} />
              <MiniStat icon="calendar-days" value={events.length} label={t.admin.events} />
              <MiniStat icon="eye" value={(views as number) ?? 0} label={t.orgadmin.views} />
            </div>
            <div style={{ ...card, padding: 18, flex: 1 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.orgadmin.approvalTitle}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "var(--fs-sm)" }}>{t.orgadmin.orgProfile}</span>
                  {org.status === "published" ? (
                    <StatusLabel icon="check" label={t.orgadmin.approved} tone="success" size="sm" />
                  ) : (
                    <StatusLabel icon="clock" label={t.orgadmin.pending} tone="neutral" size="sm" />
                  )}
                </div>
                {[...activities, ...events].slice(0, 4).map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3">
                    <span style={{ fontSize: "var(--fs-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                    {r.status === "published" ? (
                      <StatusLabel icon="check" label={t.orgadmin.approved} tone="success" size="sm" />
                    ) : (
                      <StatusLabel icon="clock" label={t.orgadmin.pending} tone="neutral" size="sm" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <ListSection
          id="aktiviteter"
          title={t.orgadmin.yourActivities}
          newHref="/admin/aktivitet/ny"
          newLabel={t.admin.newActivity}
          empty={t.admin.noActivities}
          rows={activities}
          editBase="/admin/aktivitet"
          table="activities"
          t={t}
          locale={locale}
        />
        <ListSection
          id="arrangementer"
          title={t.orgadmin.yourEvents}
          newHref="/admin/arrangement/ny"
          newLabel={t.admin.newEvent}
          empty={t.admin.noEvents}
          rows={events}
          editBase="/admin/arrangement"
          table="events"
          t={t}
          locale={locale}
        />
      </div>
    </AdminShell>
  );
}

function MiniStat({ icon, value, label }: { icon: "repeat" | "calendar-days" | "eye"; value: number | string; label: string }) {
  return (
    <div style={{ ...card, padding: 16 }}>
      <Icon name={icon} size={20} color="var(--fjord-600)" />
      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>{value}</div>
      <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function rowSchedule(row: Row, table: string, t: Dictionary, locale: Locale): string | null {
  if (table === "events") return row.starts_at ? formatEventDate(row.starts_at, locale) : null;
  const s = [weekdayName(row.weekday, locale), formatTimeRange(row.start_time, row.end_time)].filter(Boolean).join(" · ");
  return s || row.recurrence_note || null;
}

function ListSection({
  id, title, newHref, newLabel, empty, rows, editBase, table, t, locale,
}: {
  id: string; title: string; newHref: string; newLabel: string; empty: string;
  rows: Row[]; editBase: string; table: "activities" | "events"; t: Dictionary; locale: Locale;
}) {
  return (
    <section id={id} style={card}>
      <div className="flex items-center justify-between" style={{ padding: "16px 18px", borderBottom: "1px solid var(--border-subtle)" }}>
        <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{title}</h2>
        <Link href={newHref}><Button variant="secondary" size="sm" leadingIcon="plus">{newLabel}</Button></Link>
      </div>
      {rows.length === 0 ? (
        <p style={{ padding: "16px 18px", margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{empty}</p>
      ) : (
        rows.map((r, i) => {
          const schedule = rowSchedule(r, table, t, locale);
          return (
            <div key={r.id} className="flex items-center gap-3" style={{ padding: "12px 18px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <Thumb row={r} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--fs-body)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                {schedule && (
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <Icon name="clock" size={14} /> {schedule}
                  </div>
                )}
              </div>
              <StatusBadge status={r.status} t={t} />
              <Link href={`${editBase}/${r.id}`}><IconButton icon="pencil" label={t.admin.edit} variant="outline" size="sm" /></Link>
              <DeleteButton table={table} id={r.id} />
            </div>
          );
        })
      )}
    </section>
  );
}
