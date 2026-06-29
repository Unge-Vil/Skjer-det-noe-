import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyDepartments } from "@/lib/departments";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon } from "@/components/ds/Icon";
import { AdminShell, type NavItem } from "@/components/admin/AdminShell";
import { ShellIdentity } from "@/components/admin/ShellIdentity";

export const dynamic = "force-dynamic";

const cardStyle = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: "12px 16px",
} as const;

export default async function DepartmentsPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const departments = await getMyDepartments();

  const nav: NavItem[] = [
    { href: "/admin", label: t.orgadmin.overview, icon: "layout-dashboard" },
    { href: "/admin/avdelinger", label: t.orgadmin.departments, icon: "building-2", active: true },
  ];

  return (
    <AdminShell
      title={t.orgadmin.departments}
      identity={<ShellIdentity name={t.orgadmin.departments} sub={user.email ?? ""} />}
      nav={nav}
    >
      <div className="mx-auto w-full max-w-3xl" style={{ padding: 24 }}>
        <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          {t.orgadmin.departmentsSub}
        </p>
        {departments.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.orgadmin.noDepartments}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {departments.map((d) => (
              <Link key={d.id} href={`/admin/avdelinger/${d.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="flex items-center justify-between gap-3" style={cardStyle}>
                  <div className="min-w-0">
                    <p style={{ margin: 0, fontWeight: 600 }}>{d.organizationName}</p>
                    <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="map-pin" size={12} /> {d.municipalityName}
                    </p>
                  </div>
                  <Icon name="pencil" size={16} color="var(--text-muted)" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
