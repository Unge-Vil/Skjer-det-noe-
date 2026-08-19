import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { OrgStatusButton } from "@/components/admin/OrgStatusButton";
import { platformNav } from "@/components/admin/platformNav";

export const dynamic = "force-dynamic";
type Org = { id: string; name: string; status: string; org_number: string | null };

export default async function PlatformOrganisationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const locale = await getLocale();
  const t = getDictionary(locale);
  const params = await searchParams;
  const query = params.q?.trim().toLocaleLowerCase() ?? "";
  const status = params.status === "draft" || params.status === "published" ? params.status : "";
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("is_platform_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_platform_admin) redirect("/plattform");
  const { data } = await supabase.from("organizations").select("id,name,status,org_number").order("name");
  const orgs = ((data as Org[]) ?? []).filter((org) => (!status || org.status === status) && (!query || `${org.name} ${org.org_number ?? ""}`.toLocaleLowerCase().includes(query)));

  return <AdminShell title={t.platform.allOrgs} identity={<ContextSwitcher />} nav={platformNav(t)}>
    <main id="main" className="mx-auto w-full max-w-5xl" style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}><h1 style={{ margin: "0 0 6px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.platform.allOrgs}</h1><p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>Godkjenn og følg opp alle organisasjoner i plattformen.</p></div>
      <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end" style={{ marginBottom: 18 }}><label className="flex min-w-0 flex-1 flex-col gap-1" style={labelStyle}>Søk<input type="search" name="q" defaultValue={params.q ?? ""} placeholder="Navn eller org.nr." style={inputStyle} /></label><label className="flex flex-col gap-1 sm:w-52" style={labelStyle}>Status<select name="status" defaultValue={status} style={inputStyle}><option value="">Alle statuser</option><option value="draft">Venter på godkjenning</option><option value="published">Publisert</option></select></label><button type="submit" style={buttonStyle}>Søk</button></form>
      <div style={tableWrap}><table style={tableStyle}><thead><tr><th style={th}>Organisasjon</th><th style={th}>Org.nr.</th><th style={th}>Status</th><th style={{ ...th, textAlign: "right" }}>Handling</th></tr></thead><tbody>{orgs.map((org) => <tr key={org.id} style={tr}><td style={{ ...td, fontWeight: 700 }}>{org.name}</td><td style={{ ...td, color: "var(--text-muted)" }}>{org.org_number ?? "–"}</td><td style={td}>{org.status === "published" ? "Publisert" : "Venter på godkjenning"}</td><td style={{ ...td, textAlign: "right" }}><OrgStatusButton id={org.id} status={org.status} /></td></tr>)}</tbody></table></div>
    </main>
  </AdminShell>;
}

const labelStyle = { fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--text-muted)" } as const;
const inputStyle = { width: "100%", minHeight: 42, padding: "9px 12px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", color: "var(--text-body)", fontSize: "var(--fs-sm)" } as const;
const buttonStyle = { minHeight: 42, padding: "9px 16px", border: "1px solid var(--fjord-700)", borderRadius: "var(--radius-md)", background: "var(--fjord-700)", color: "white", fontWeight: 700, cursor: "pointer" } as const;
const tableWrap = { overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-card)" } as const;
const tableStyle = { width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: "var(--fs-sm)" } as const;
const th = { padding: "11px 16px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", textAlign: "left", fontSize: "var(--fs-xs)" } as const;
const td = { padding: "13px 16px" } as const;
const tr = { borderBottom: "1px solid var(--border-subtle)" } as const;
