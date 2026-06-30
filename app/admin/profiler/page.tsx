import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyProfiles } from "@/lib/profiles";
import { getMyOrgs } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon } from "@/components/ds/Icon";
import { AdminShell, type NavItem } from "@/components/admin/AdminShell";
import { OrgSwitcher } from "@/components/admin/OrgSwitcher";
import { CreateProfileForm } from "@/components/admin/CreateProfileForm";

export const dynamic = "force-dynamic";

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
} as const;

export default async function ProfilesPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const [profiles, orgs, { data: muniData }] = await Promise.all([
    getMyProfiles(),
    getMyOrgs(),
    supabase.from("municipalities_view").select("id,name").order("name"),
  ]);
  const municipalities = (muniData as { id: string; name: string }[]) ?? [];

  const nav: NavItem[] = [
    { href: "/admin", label: t.orgadmin.overview, icon: "layout-dashboard" },
    { href: "/admin/profiler", label: t.orgadmin.departments, icon: "building-2", active: true },
  ];

  return (
    <AdminShell
      title={t.orgadmin.departments}
      identity={<OrgSwitcher orgs={orgs} />}
      nav={nav}
    >
      <div className="mx-auto w-full max-w-3xl" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <p style={{ margin: "0 0 12px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
            {t.orgadmin.departmentsSub}
          </p>
          {profiles.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.orgadmin.noDepartments}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {profiles.map((p) => (
                <Link key={p.id} href={`/admin/profiler/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="flex items-center justify-between gap-3" style={{ ...card, padding: "12px 16px" }}>
                    <div className="min-w-0">
                      <p style={{ margin: 0, fontWeight: 600 }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                        <span>{p.organizationName}</span>
                        {p.municipalityName && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            · <Icon name="map-pin" size={12} /> {p.municipalityName}
                          </span>
                        )}
                      </p>
                    </div>
                    <Icon name="pencil" size={16} color="var(--text-muted)" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {orgs.length > 0 && (
          <section style={{ ...card, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.orgadmin.createProfile}</h2>
              <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.orgadmin.createProfileHint}</p>
            </div>
            <CreateProfileForm orgs={orgs} municipalities={municipalities} />
          </section>
        )}
      </div>
    </AdminShell>
  );
}
