import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { getActiveMunicipality } from "@/lib/kommune";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatEventDate, formatTimeRange, weekdayName } from "@/lib/format";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { DirectoryStatusButton } from "@/components/admin/DirectoryStatusButton";
import { kommuneNav } from "@/components/admin/kommuneNav";

export const dynamic = "force-dynamic";

type DirectoryListing = {
  id: string;
  slug: string;
  kind: "service" | "volunteer";
  title: string;
  status: string;
  area: string | null;
  organizations: { name: string } | null;
};

type Activity = { id: string; slug: string; title: string; status: string; weekday: number | null; start_time: string | null; end_time: string | null; organizations: { name: string } | null };
type Event = { id: string; slug: string; title: string; status: string; starts_at: string; organizations: { name: string } | null };
type ContentRow = { id: string; slug: string; title: string; type: "activity" | "event" | "service" | "volunteer"; status: string; organisation: string; detail: string };

export default async function KommuneContentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; status?: string; sort?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const active = await getActiveMunicipality();
  if (!active) redirect("/kommune");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const params = await searchParams;
  const query = params.q?.trim().toLocaleLowerCase() ?? "";
  const kind = ["activity", "event", "service", "volunteer"].includes(params.kind ?? "") ? params.kind! : "";
  const status = params.status === "draft" || params.status === "published" ? params.status : "";
  const sort = params.sort === "status" || params.sort === "organisation" ? params.sort : "title";
  const supabase = await createClient();

  const [directoryRes, activitiesRes, eventsRes] = await Promise.all([
    supabase
    .from("directory_listings")
    .select("id,kind,slug,title,status,area,organizations!directory_listings_organization_id_fkey(name)")
    .eq("municipality_id", active.id)
    .order("updated_at", { ascending: false }),
    supabase.from("activities").select("id,slug,title,status,weekday,start_time,end_time,organizations!activities_organization_id_fkey(name)").eq("municipality_id", active.id),
    supabase.from("events").select("id,slug,title,status,starts_at,organizations!events_organization_id_fkey(name)").eq("municipality_id", active.id),
  ]);

  const directory = (directoryRes.data as unknown as DirectoryListing[]) ?? [];
  const activities = (activitiesRes.data as unknown as Activity[]) ?? [];
  const events = (eventsRes.data as unknown as Event[]) ?? [];
  const rows: ContentRow[] = [
    ...activities.map((item) => ({ id: item.id, slug: item.slug, title: item.title, type: "activity" as const, status: item.status, organisation: item.organizations?.name ?? "", detail: `${weekdayName(item.weekday, locale) ?? ""}${formatTimeRange(item.start_time, item.end_time) ? ` · ${formatTimeRange(item.start_time, item.end_time)}` : ""}` })),
    ...events.map((item) => ({ id: item.id, slug: item.slug, title: item.title, type: "event" as const, status: item.status, organisation: item.organizations?.name ?? "", detail: formatEventDate(item.starts_at, locale) })),
    ...directory.map((item) => ({ id: item.id, slug: item.slug, title: item.title, type: item.kind, status: item.status, organisation: item.organizations?.name ?? "", detail: item.area ?? "" })),
  ].filter((item) => (!kind || item.type === kind) && (!status || item.status === status) && (!query || `${item.title} ${item.organisation} ${item.detail}`.toLocaleLowerCase().includes(query)))
    .sort((a, b) => sort === "status" ? a.status.localeCompare(b.status) || a.title.localeCompare(b.title) : sort === "organisation" ? a.organisation.localeCompare(b.organisation) || a.title.localeCompare(b.title) : a.title.localeCompare(b.title));

  return (
    <AdminShell title={t.kommune.content} identity={<ContextSwitcher />} nav={kommuneNav(t, "/kommune/innhold")}>
      <main id="main" className="mx-auto w-full max-w-5xl" style={{ padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.kommune.content}</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.kommune.contentSubtitle}</p>
        </div>

        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end" style={{ marginBottom: 18 }}>
          <label className="flex min-w-0 flex-1 flex-col gap-1" style={labelStyle}>
            Søk
            <input type="search" name="q" defaultValue={params.q ?? ""} placeholder="Søk etter tittel, område eller organisasjon" style={inputStyle} />
          </label>
          <label className="flex flex-col gap-1 sm:w-52" style={labelStyle}>
            {t.kommune.contentType}
            <select name="kind" defaultValue={kind} style={inputStyle}>
              <option value="">{t.kommune.allContent}</option>
              <option value="activity">{t.kommune.activities}</option>
              <option value="event">Arrangementer</option>
              <option value="service">{t.kommune.serviceContent}</option>
              <option value="volunteer">{t.kommune.volunteerContent}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 sm:w-44" style={labelStyle}>
            Status
            <select name="status" defaultValue={status} style={inputStyle}>
              <option value="">Alle statuser</option>
              <option value="published">Godkjent</option>
              <option value="draft">Ikke godkjent</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 sm:w-48" style={labelStyle}>
            Sorter etter
            <select name="sort" defaultValue={sort} style={inputStyle}>
              <option value="title">Tittel</option>
              <option value="organisation">Organisasjon</option>
              <option value="status">Status</option>
            </select>
          </label>
          <button type="submit" style={buttonStyle}>Søk</button>
        </form>

        <div style={{ marginBottom: 10, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{rows.length} treff</div>
        {rows.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.kommune.noContent}</p> : (
          <>
            {/* Mobile: card list — the desktop table (minWidth 760) overflows a phone. */}
            <div className="flex flex-col gap-2 sm:hidden">
              {rows.map((item) => {
                const typeLabel = item.type === "activity" ? t.kommune.activities : item.type === "event" ? "Arrangement" : item.type === "service" ? t.kommune.serviceContent : t.kommune.volunteerContent;
                return (
                  <div key={item.id} style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <Link href={contentHref(item)} style={{ color: "var(--text-link)", textDecoration: "none", fontWeight: 700 }}>{item.title}</Link>
                        {item.detail && <div style={{ marginTop: 3, color: "var(--text-muted)", fontSize: "var(--fs-xs)" }}>{item.detail}</div>}
                      </div>
                      <span style={{ flex: "none", padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--fs-xs)", fontWeight: 700, background: item.status === "published" ? "var(--surface-brand-soft)" : "var(--stone-100)", color: item.status === "published" ? "var(--text-brand)" : "var(--stone-700)" }}>
                        {item.status === "published" ? t.kommune.approvedFilter : t.kommune.notApprovedFilter}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-xs)", fontWeight: 600, minWidth: 0 }}>{typeLabel}{item.organisation ? ` · ${item.organisation}` : ""}</span>
                      {(item.type === "service" || item.type === "volunteer") && <DirectoryStatusButton id={item.id} status={item.status} />}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop: full table. */}
            <div className="hidden sm:block" style={tableWrap}>
              <table style={tableStyle}>
                <thead><tr><th style={th}>Tittel</th><th style={th}>{t.kommune.contentType}</th><th style={th}>Organisasjon</th><th style={th}>Status</th><th style={{ ...th, textAlign: "right" }}>Handling</th></tr></thead>
                <tbody>{rows.map((item) => (
                  <tr key={item.id} style={tr}>
                    <td style={{ ...td, fontWeight: 700 }}><Link href={contentHref(item)} style={{ color: "var(--text-link)", textDecoration: "none" }}>{item.title}</Link>{item.detail && <div style={{ marginTop: 3, color: "var(--text-muted)", fontSize: "var(--fs-xs)", fontWeight: 400 }}>{item.detail}</div>}</td>
                    <td style={td}>{item.type === "activity" ? t.kommune.activities : item.type === "event" ? "Arrangement" : item.type === "service" ? t.kommune.serviceContent : t.kommune.volunteerContent}</td>
                    <td style={{ ...td, color: "var(--text-muted)" }}>{item.organisation || "–"}</td>
                    <td style={td}>{item.status === "published" ? t.kommune.approvedFilter : t.kommune.notApprovedFilter}</td>
                    <td style={{ ...td, textAlign: "right" }}>{item.type === "service" || item.type === "volunteer" ? <DirectoryStatusButton id={item.id} status={item.status} /> : "–"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </AdminShell>
  );
}

const labelStyle = { fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--text-muted)" } as const;
const inputStyle = { width: "100%", minHeight: "var(--tap-comfy)", padding: "9px 12px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", color: "var(--text-body)", fontSize: "var(--fs-sm)" } as const;
const buttonStyle = { minHeight: "var(--tap-comfy)", padding: "9px 16px", border: "1px solid var(--fjord-700)", borderRadius: "var(--radius-md)", background: "var(--fjord-700)", color: "var(--text-on-brand)", fontWeight: 700, cursor: "pointer" } as const;
const tableWrap = { overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-card)" } as const;
const tableStyle = { width: "100%", minWidth: 760, borderCollapse: "collapse", fontSize: "var(--fs-sm)" } as const;
const cardStyle = { border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-card)", padding: 14 } as const;
const th = { padding: "11px 16px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", textAlign: "left", fontSize: "var(--fs-xs)" } as const;
const td = { padding: "13px 16px" } as const;
const tr = { borderBottom: "1px solid var(--border-subtle)" } as const;

function contentHref(item: ContentRow) {
  const base = item.type === "activity" ? "/aktivitet" : item.type === "event" ? "/arrangement" : item.type === "service" ? "/tjeneste" : "/frivillig";
  return `${base}/${item.slug}`;
}
