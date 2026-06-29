import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { LogoutButton } from "@/components/LogoutButton";
import { OrgStatusButton } from "@/components/admin/OrgStatusButton";
import { MuniAdminManager } from "@/components/admin/MuniAdminManager";
import { MuniCreateForm } from "@/components/admin/MuniCreateForm";
import { AdminShell, type NavItem } from "@/components/admin/AdminShell";
import { ShellIdentity } from "@/components/admin/ShellIdentity";

export const dynamic = "force-dynamic";

type Org = { id: string; name: string; status: string };
type Muni = { id: string; name: string };
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

  const [orgRes, muniRes, adminRes] = await Promise.all([
    supabase.from("organizations").select("id,name,status").order("status").order("name"),
    supabase.from("municipalities_view").select("id,name").order("name"),
    supabase.rpc("list_municipality_admins"),
  ]);

  const orgs = (orgRes.data as Org[]) ?? [];
  const municipalities = (muniRes.data as Muni[]) ?? [];
  const admins = (adminRes.data as AdminRow[]) ?? [];

  const statusText = (s: string) =>
    s === "published" ? t.admin.statusPublished : s === "archived" ? t.admin.statusArchived : t.admin.statusDraft;

  const nav: NavItem[] = [
    { href: "/plattform", label: t.orgadmin.overview, icon: "layout-dashboard" },
  ];

  return (
    <AdminShell
      title={t.platform.title}
      identity={<ShellIdentity name={t.platform.title} sub={user.email ?? ""} />}
      nav={nav}
    >
      <div className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
      <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
        {t.platform.subtitle}
      </p>

      <section className="mb-10">
        <h2 style={{ margin: "0 0 12px", fontSize: "var(--fs-h3)", fontWeight: 700 }}>{t.platform.createMuni}</h2>
        <div style={cardStyle}>
          <MuniCreateForm />
        </div>
      </section>

      <section className="mb-10">
        <h2 style={{ margin: "0 0 12px", fontSize: "var(--fs-h3)", fontWeight: 700 }}>{t.platform.muniAdmins}</h2>
        <MuniAdminManager municipalities={municipalities} admins={admins} />
      </section>

      <section>
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
