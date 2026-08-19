import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { MuniAdminManager } from "@/components/admin/MuniAdminManager";
import { platformNav } from "@/components/admin/platformNav";

export const dynamic = "force-dynamic";

type Municipality = { id: string; name: string };
type AdminRow = { municipality_id: string; municipality_name: string; user_id: string; email: string };

export default async function PlatformAccessPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("is_platform_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_platform_admin) redirect("/plattform");

  const [{ data: muniData }, { data: adminData }] = await Promise.all([
    supabase.from("municipalities_view").select("id,name").order("name"),
    supabase.rpc("list_municipality_admins"),
  ]);

  return <AdminShell title={t.platform.muniAdmins} identity={<ContextSwitcher />} nav={platformNav(t)}>
    <main id="main" className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}><h1 style={{ margin: "0 0 6px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.platform.muniAdmins}</h1><p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>Gi kommuneadministratorer tilgang uten å endre organisasjonsmedlemskap.</p></div>
      <section style={{ padding: 20, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)" }}>
        <MuniAdminManager municipalities={(muniData as Municipality[]) ?? []} admins={(adminData as AdminRow[]) ?? []} />
      </section>
    </main>
  </AdminShell>;
}
