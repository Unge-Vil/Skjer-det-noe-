import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { getActiveProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatEventDate, formatTimeRange, weekdayName } from "@/lib/format";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { DirectoryStatusButton } from "@/components/admin/DirectoryStatusButton";
import { orgAdminNav } from "@/components/admin/orgAdminNav";

export const dynamic = "force-dynamic";

type DirectoryListing = { id: string; slug: string; kind: "service" | "volunteer"; title: string; status: string; area: string | null };
type Activity = { id: string; slug: string; title: string; status: string; weekday: number | null; start_time: string | null; end_time: string | null };
type Event = { id: string; slug: string; title: string; status: string; starts_at: string };
type ContentRow = { id: string; slug: string; title: string; type: "activity" | "event" | "service" | "volunteer"; status: string; detail: string };

export default async function OrgContentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; status?: string; sort?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const org = await getMyOrg();
  if (!org) redirect("/admin");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const activeProfile = await getActiveProfile();
  const params = await searchParams;
  const query = params.q?.trim().toLocaleLowerCase() ?? "";
  const kind = ["activity", "event", "service", "volunteer"].includes(params.kind ?? "") ? params.kind! : "";
  const status = params.status === "draft" || params.status === "published" ? params.status : "";
  const sort = params.sort === "status" ? params.sort : "title";
  const supabase = await createClient();

  const activityQuery = supabase.from("activities").select("id,slug,title,status,weekday,start_time,end_time").eq("organization_id", org.id);
  const eventQuery = supabase.from("events").select("id,slug,title,status,starts_at").eq("organization_id", org.id);
  const directoryQuery = supabase.from("directory_listings").select("id,slug,kind,title,status,area").eq("organization_id", org.id);
  if (activeProfile?.organizationId === org.id) {
    activityQuery.eq("profile_id", activeProfile.id);
    eventQuery.eq("profile_id", activeProfile.id);
    directoryQuery.eq("profile_id", activeProfile.id);
  }
  const [activitiesRes, eventsRes, directoryRes] = await Promise.all([activityQuery, eventQuery, directoryQuery]);
  const activities = (activitiesRes.data as Activity[] | null) ?? [];
  const events = (eventsRes.data as Event[] | null) ?? [];
  const directory = (directoryRes.data as DirectoryListing[] | null) ?? [];
  const rows: ContentRow[] = [
    ...activities.map((item) => ({ id: item.id, slug: item.slug, title: item.title, type: "activity" as const, status: item.status, detail: `${weekdayName(item.weekday, locale) ?? ""}${formatTimeRange(item.start_time, item.end_time) ? ` · ${formatTimeRange(item.start_time, item.end_time)}` : ""}` })),
    ...events.map((item) => ({ id: item.id, slug: item.slug, title: item.title, type: "event" as const, status: item.status, detail: formatEventDate(item.starts_at, locale) })),
    ...directory.map((item) => ({ id: item.id, slug: item.slug, title: item.title, type: item.kind, status: item.status, detail: item.area ?? "" })),
  ].filter((item) => (!kind || item.type === kind) && (!status || item.status === status) && (!query || `${item.title} ${item.detail}`.toLocaleLowerCase().includes(query)))
    .sort((a, b) => sort === "status" ? a.status.localeCompare(b.status) || a.title.localeCompare(b.title) : a.title.localeCompare(b.title));

  return (
    <AdminShell title={activeProfile?.name ?? org.name} identity={<ContextSwitcher />} nav={orgAdminNav(t)}>
      <main id="main" className="mx-auto w-full max-w-5xl" style={{ padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.kommune.content}</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.orgadmin.yourActivities} og {t.orgadmin.yourEvents.toLocaleLowerCase()}</p>
        </div>
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end" style={{ marginBottom: 18 }}>
          <label className="flex min-w-0 flex-1 flex-col gap-1" style={labelStyle}>Søk<input type="search" name="q" defaultValue={params.q ?? ""} placeholder="Søk etter tittel eller område" style={inputStyle} /></label>
          <label className="flex flex-col gap-1 sm:w-52" style={labelStyle}>{t.kommune.contentType}<select name="kind" defaultValue={kind} style={inputStyle}><option value="">{t.kommune.allContent}</option><option value="activity">{t.kommune.activities}</option><option value="event">Arrangementer</option><option value="service">{t.kommune.serviceContent}</option><option value="volunteer">{t.kommune.volunteerContent}</option></select></label>
          <label className="flex flex-col gap-1 sm:w-44" style={labelStyle}>Status<select name="status" defaultValue={status} style={inputStyle}><option value="">Alle statuser</option><option value="published">{t.admin.statusPublished}</option><option value="draft">{t.admin.statusDraft}</option></select></label>
          <label className="flex flex-col gap-1 sm:w-40" style={labelStyle}>Sorter etter<select name="sort" defaultValue={sort} style={inputStyle}><option value="title">Tittel</option><option value="status">Status</option></select></label>
          <button type="submit" style={buttonStyle}>Søk</button>
        </form>
        <div style={{ marginBottom: 10, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{rows.length} treff</div>
        {rows.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.kommune.noContent}</p> : (
          <div style={tableWrap}><table style={tableStyle}><thead><tr><th style={th}>Tittel</th><th style={th}>{t.kommune.contentType}</th><th style={th}>Status</th><th style={{ ...th, textAlign: "right" }}>Handling</th></tr></thead><tbody>{rows.map((item) => (
            <tr key={item.id} style={tr}><td style={{ ...td, fontWeight: 700 }}><Link href={publicHref(item)} style={{ color: "var(--text-link)", textDecoration: "none" }}>{item.title}</Link>{item.detail && <div style={{ marginTop: 3, color: "var(--text-muted)", fontSize: "var(--fs-xs)", fontWeight: 400 }}>{item.detail}</div>}</td><td style={td}>{typeLabel(item, t)}</td><td style={td}>{item.status === "published" ? t.admin.statusPublished : t.admin.statusDraft}</td><td style={{ ...td, textAlign: "right" }}><Link href={editHref(item)} style={{ color: "var(--text-link)", textDecoration: "none", fontWeight: 700 }}>Rediger</Link>{(item.type === "service" || item.type === "volunteer") && <span style={{ marginLeft: 12 }}><DirectoryStatusButton id={item.id} status={item.status} /></span>}</td></tr>
          ))}</tbody></table></div>
        )}
      </main>
    </AdminShell>
  );
}

const labelStyle = { fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--text-muted)" } as const;
const inputStyle = { width: "100%", minHeight: "var(--tap-comfy)", padding: "9px 12px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", color: "var(--text-body)", fontSize: "var(--fs-sm)" } as const;
const buttonStyle = { minHeight: "var(--tap-comfy)", padding: "9px 16px", border: "1px solid var(--fjord-700)", borderRadius: "var(--radius-md)", background: "var(--fjord-700)", color: "var(--text-on-brand)", fontWeight: 700, cursor: "pointer" } as const;
const tableWrap = { overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-card)" } as const;
const tableStyle = { width: "100%", minWidth: 680, borderCollapse: "collapse", fontSize: "var(--fs-sm)" } as const;
const th = { padding: "11px 16px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", textAlign: "left", fontSize: "var(--fs-xs)" } as const;
const td = { padding: "13px 16px" } as const;
const tr = { borderBottom: "1px solid var(--border-subtle)" } as const;

function typeLabel(item: ContentRow, t: ReturnType<typeof getDictionary>) {
  return item.type === "activity" ? t.kommune.activities : item.type === "event" ? "Arrangement" : item.type === "service" ? t.kommune.serviceContent : t.kommune.volunteerContent;
}

function publicHref(item: ContentRow) {
  const base = item.type === "activity" ? "/aktivitet" : item.type === "event" ? "/arrangement" : item.type === "service" ? "/tjeneste" : "/frivillig";
  return `${base}/${item.slug}`;
}

function editHref(item: ContentRow) {
  const base = item.type === "activity" ? "/admin/aktivitet" : item.type === "event" ? "/admin/arrangement" : item.type === "service" ? "/admin/oppdrag/tjeneste" : "/admin/oppdrag/frivillig";
  return `${base}/${item.id}`;
}