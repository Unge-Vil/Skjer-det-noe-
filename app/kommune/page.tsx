import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon } from "@/components/ds/Icon";
import { LogoutButton } from "@/components/LogoutButton";
import { OrgStatusButton } from "@/components/admin/OrgStatusButton";
import { AdminShell, type NavItem } from "@/components/admin/AdminShell";
import { ShellIdentity } from "@/components/admin/ShellIdentity";

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

  const [{ data: profile }, { data: adminRows }] = await Promise.all([
    supabase.from("profiles").select("is_platform_admin").eq("id", user.id).maybeSingle(),
    supabase.from("municipality_admins").select("municipality_id").eq("user_id", user.id),
  ]);

  const isPlatform = Boolean(profile?.is_platform_admin);
  const muniIds = (adminRows ?? []).map((r) => r.municipality_id as string);

  if (!isPlatform && muniIds.length === 0) {
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

  // Collect organisations in scope (deduped).
  const byId = new Map<string, Org>();
  if (isPlatform) {
    const { data } = await supabase
      .from("organizations")
      .select("id,name,status,org_number,is_volunteer")
      .order("name");
    for (const o of (data as Org[]) ?? []) byId.set(o.id, o);
  } else {
    const { data } = await supabase
      .from("organization_municipalities")
      .select("organizations(id,name,status,org_number,is_volunteer)")
      .in("municipality_id", muniIds);
    for (const row of data ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const o = (row as any).organizations as Org | null;
      if (o) byId.set(o.id, o);
    }
  }

  const orgs = [...byId.values()];
  const pending = orgs.filter((o) => o.status === "draft");
  const approved = orgs.filter((o) => o.status === "published");

  const nav: NavItem[] = [
    { href: "/kommune", label: t.orgadmin.overview, icon: "layout-dashboard" },
  ];

  return (
    <AdminShell
      title={t.kommune.title}
      identity={<ShellIdentity name={t.kommune.title} sub={user.email ?? ""} />}
      nav={nav}
    >
      <div className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
        <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          {t.kommune.subtitle}
        </p>
        <OrgList title={t.kommune.pending} empty={t.kommune.noPending} orgs={pending} t={t} />
        <div className="h-8" />
        <OrgList title={t.kommune.approved} empty={t.kommune.noApproved} orgs={approved} t={t} />
      </div>
    </AdminShell>
  );
}

function OrgList({
  title,
  empty,
  orgs,
  t,
}: {
  title: string;
  empty: string;
  orgs: Org[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <section>
      <h2 style={{ margin: "0 0 12px", fontSize: "var(--fs-h3)", fontWeight: 700 }}>{title}</h2>
      {orgs.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{empty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {orgs.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3" style={{ ...cardStyle, padding: "12px 16px" }}>
              <div className="min-w-0">
                <p style={{ margin: 0, fontWeight: 600 }}>{o.name}</p>
                <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {o.is_volunteer && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Icon name="sparkles" size={12} /> {t.kommune.volunteer}
                    </span>
                  )}
                  {o.org_number && <span>{t.kommune.orgNumber}: {o.org_number}</span>}
                </p>
              </div>
              <OrgStatusButton id={o.id} status={o.status} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
