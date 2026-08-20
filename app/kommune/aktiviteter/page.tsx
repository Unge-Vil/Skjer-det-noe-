import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getActiveMunicipality } from "@/lib/kommune";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatEventDate, formatTimeRange, weekdayName } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/nb";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { kommuneNav } from "@/components/admin/kommuneNav";

export const dynamic = "force-dynamic";

type Activity = {
  id: string;
  title: string;
  status: string;
  weekday: number | null;
  start_time: string | null;
  end_time: string | null;
  organizations: { name: string }[] | null;
};

type Event = {
  id: string;
  title: string;
  status: string;
  starts_at: string;
  organizations: { name: string }[] | null;
};

export default async function KommuneActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const active = await getActiveMunicipality();
  if (!active) redirect("/kommune");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const params = await searchParams;
  const query = params.q?.trim().toLocaleLowerCase() ?? "";
  const supabase = await createClient();

  const [activitiesRes, eventsRes] = await Promise.all([
    supabase
      .from("activities")
      .select("id,title,status,weekday,start_time,end_time,organizations(name)")
      .eq("municipality_id", active.id)
      .order("title"),
    supabase
      .from("events")
      .select("id,title,status,starts_at,organizations(name)")
      .eq("municipality_id", active.id)
      .order("starts_at", { ascending: true }),
  ]);

  const activities = ((activitiesRes.data as unknown as Activity[]) ?? []).filter((item) => matches(item.title, item.organizations?.[0]?.name, query));
  const events = ((eventsRes.data as unknown as Event[]) ?? []).filter((item) => matches(item.title, item.organizations?.[0]?.name, query));

  return (
    <AdminShell
      title={t.kommune.activities}
      identity={<ContextSwitcher />}
      nav={kommuneNav(t, "/kommune/aktiviteter")}
    >
      <main id="main" className="mx-auto w-full max-w-5xl" style={{ padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.kommune.activities}</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.kommune.activitiesSubtitle}</p>
        </div>

        <form method="get" style={{ display: "flex", gap: 10, marginBottom: 24, maxWidth: 560 }}>
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder={t.kommune.organizationsSearch}
            aria-label={t.kommune.organizationsSearch}
            style={{ flex: 1, minWidth: 0, minHeight: "var(--tap-comfy)", padding: "9px 12px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", color: "var(--text-body)", fontSize: "var(--fs-sm)" }}
          />
          <button type="submit" style={{ minHeight: "var(--tap-comfy)", padding: "9px 16px", border: "1px solid var(--fjord-700)", borderRadius: "var(--radius-md)", background: "var(--fjord-700)", color: "var(--text-on-brand)", fontWeight: 700, cursor: "pointer" }}>
            Søk
          </button>
        </form>

        <section style={{ marginBottom: 28 }}>
          <div className="flex items-end justify-between gap-3" style={{ marginBottom: 10 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "var(--fs-h3)", fontWeight: 700 }}>{t.kommune.activities}</h2>
              <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{activities.length} {t.kommune.activityCount}</p>
            </div>
          </div>
          <ActivityTable activities={activities} locale={locale} empty={t.kommune.noActivities} t={t} />
        </section>

        <section>
          <div className="flex items-end justify-between gap-3" style={{ marginBottom: 10 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "var(--fs-h3)", fontWeight: 700 }}>Arrangementer</h2>
              <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{events.length} {t.kommune.eventCount}</p>
            </div>
          </div>
          <EventTable events={events} locale={locale} empty={t.kommune.noEvents} t={t} />
        </section>
      </main>
    </AdminShell>
  );
}

function matches(title: string, organisation: string | undefined, query: string) {
  if (!query) return true;
  return `${title} ${organisation ?? ""}`.toLocaleLowerCase().includes(query);
}

function ActivityTable({ activities, locale, empty, t }: { activities: Activity[]; locale: Locale; empty: string; t: Dictionary }) {
  if (activities.length === 0) return <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{empty}</p>;
  return (
    <div style={tableWrap}>
      <table style={tableStyle}>
        <thead><tr><th style={th}>Aktivitet</th><th style={th}>{t.kommune.activityOrganisation}</th><th style={th}>{t.kommune.activitySchedule}</th><th style={{ ...th, textAlign: "right" }}>Status</th></tr></thead>
        <tbody>{activities.map((item) => (
          <tr key={item.id} style={tr}>
            <td style={{ ...td, fontWeight: 700 }}>{item.title}</td>
            <td style={{ ...td, color: "var(--text-muted)" }}>{item.organizations?.[0]?.name ?? "–"}</td>
            <td style={{ ...td, color: "var(--text-muted)" }}>{weekdayName(item.weekday, locale) ?? "–"}{formatTimeRange(item.start_time, item.end_time) ? ` · ${formatTimeRange(item.start_time, item.end_time)}` : ""}</td>
            <td style={{ ...td, textAlign: "right" }}>{statusLabel(item.status, t)}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function EventTable({ events, locale, empty, t }: { events: Event[]; locale: Locale; empty: string; t: Dictionary }) {
  if (events.length === 0) return <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{empty}</p>;
  return (
    <div style={tableWrap}>
      <table style={tableStyle}>
        <thead><tr><th style={th}>Arrangement</th><th style={th}>{t.kommune.activityOrganisation}</th><th style={th}>{t.kommune.activitySchedule}</th><th style={{ ...th, textAlign: "right" }}>Status</th></tr></thead>
        <tbody>{events.map((item) => (
          <tr key={item.id} style={tr}>
            <td style={{ ...td, fontWeight: 700 }}>{item.title}</td>
            <td style={{ ...td, color: "var(--text-muted)" }}>{item.organizations?.[0]?.name ?? "–"}</td>
            <td style={{ ...td, color: "var(--text-muted)" }}>{formatEventDate(item.starts_at, locale)}</td>
            <td style={{ ...td, textAlign: "right" }}>{statusLabel(item.status, t)}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function statusLabel(status: string, t: Dictionary) {
  return status === "published" ? t.kommune.published : t.kommune.draft;
}

const tableWrap = { overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-card)" } as const;
const tableStyle = { width: "100%", minWidth: 680, borderCollapse: "collapse", fontSize: "var(--fs-sm)" } as const;
const th = { padding: "11px 16px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", textAlign: "left", fontSize: "var(--fs-xs)" } as const;
const td = { padding: "13px 16px" } as const;
const tr = { borderBottom: "1px solid var(--border-subtle)" } as const;
