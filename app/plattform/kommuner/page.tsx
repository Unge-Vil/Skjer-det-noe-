import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { MuniCreateForm } from "@/components/admin/MuniCreateForm";
import { platformNav } from "@/components/admin/platformNav";

export const dynamic = "force-dynamic";
type Muni = { id: string; name: string };

export default async function PlatformMunicipalitiesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const locale = await getLocale();
  const t = getDictionary(locale);
  const params = await searchParams;
  const query = params.q?.trim().toLocaleLowerCase() ?? "";
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("is_platform_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_platform_admin) redirect("/plattform");
  const { data } = await supabase.from("municipalities_view").select("id,name").order("name");
  const municipalities = ((data as Muni[]) ?? []).filter((m) => !query || m.name.toLocaleLowerCase().includes(query));

  return <AdminShell title={t.platform.municipalities} identity={<ContextSwitcher />} nav={platformNav(t)}>
    <main id="main" className="mx-auto w-full max-w-5xl" style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}><h1 style={{ margin: "0 0 6px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.platform.municipalities}</h1><p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>Opprett, søk og administrer kommuner.</p></div>
      <section style={{ marginBottom: 28, padding: 20, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)" }}><h2 style={{ margin: "0 0 12px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.platform.createMuni}</h2><MuniCreateForm /></section>
      <form method="get" style={{ display: "flex", gap: 10, marginBottom: 14, maxWidth: 480 }}><input type="search" name="q" defaultValue={params.q ?? ""} placeholder="Søk etter kommune" aria-label="Søk etter kommune" style={{ flex: 1, minHeight: "var(--tap-comfy)", padding: "9px 12px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", color: "var(--text-body)" }} /><button type="submit" style={{ minHeight: "var(--tap-comfy)", padding: "9px 15px", border: "1px solid var(--fjord-700)", borderRadius: "var(--radius-md)", background: "var(--fjord-700)", color: "var(--text-on-brand)", fontWeight: 700 }}>Søk</button></form>
      <ul className="flex flex-col gap-2.5 sm:hidden" style={{ listStyle: "none", margin: 0, padding: 0 }}>{municipalities.map((m) => <li key={m.id} style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-card)", padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><span style={{ fontWeight: 700, minWidth: 0 }}>{m.name}</span><Link href={`/plattform/kommune/${m.id}`} style={{ flex: "none", color: "var(--text-link)", fontWeight: 700, textDecoration: "none" }}>{t.platform.manageMuni} →</Link></li>)}</ul>
      <div className="hidden sm:block" style={{ overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-card)" }}><table style={{ width: "100%", minWidth: 500, borderCollapse: "collapse", fontSize: "var(--fs-sm)" }}><thead><tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", textAlign: "left", fontSize: "var(--fs-xs)" }}><th style={{ padding: "11px 16px" }}>Kommune</th><th style={{ padding: "11px 16px", textAlign: "right" }}>Handling</th></tr></thead><tbody>{municipalities.map((m) => <tr key={m.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}><td style={{ padding: "13px 16px", fontWeight: 700 }}>{m.name}</td><td style={{ padding: "13px 16px", textAlign: "right" }}><Link href={`/plattform/kommune/${m.id}`} style={{ color: "var(--text-link)", fontWeight: 700, textDecoration: "none" }}>{t.platform.manageMuni} →</Link></td></tr>)}</tbody></table></div>
    </main>
  </AdminShell>;
}
