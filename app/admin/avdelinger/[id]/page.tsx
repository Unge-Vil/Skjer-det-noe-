import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyDepartments, getDepartment } from "@/lib/departments";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Button } from "@/components/ds/Button";
import { AdminShell, type NavItem } from "@/components/admin/AdminShell";
import { ShellIdentity } from "@/components/admin/ShellIdentity";
import { DepartmentForm } from "@/components/admin/DepartmentForm";
import { DepartmentImages } from "@/components/admin/DepartmentImages";
import { DepartmentMemberManager } from "@/components/admin/DepartmentMemberManager";

export const dynamic = "force-dynamic";

type Member = { user_id: string; email: string; role: string };

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export default async function DepartmentEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  // Authorisation: the department must be one the user can administer.
  const departments = await getMyDepartments();
  if (!departments.some((d) => d.id === id)) notFound();

  const dept = await getDepartment(id);
  if (!dept) notFound();

  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const { data: memberRows } = await supabase.rpc("list_department_members", {
    p_org: dept.organizationId,
    p_muni: dept.municipalityId,
  });
  const members = (memberRows as Member[]) ?? [];

  const publicHref = `/organisasjon/${dept.organizationSlug}/${dept.municipalitySlug}`;
  const nav: NavItem[] = [
    { href: "/admin", label: t.orgadmin.overview, icon: "layout-dashboard" },
    { href: "/admin/avdelinger", label: t.orgadmin.departments, icon: "building-2", active: true },
  ];

  return (
    <AdminShell
      title={`${dept.organizationName} · ${dept.municipalityName}`}
      identity={<ShellIdentity name={dept.organizationName} sub={dept.municipalityName} />}
      nav={nav}
      headerAction={
        <a href={publicHref} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm" leadingIcon="external-link">{t.orgadmin.openDeptPublic}</Button>
        </a>
      }
    >
      <DepartmentForm dept={dept} />

      <div className="mx-auto w-full max-w-3xl" style={{ padding: "0 24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        <section style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.orgadmin.media}</h2>
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.orgadmin.departmentsSub}</p>
          </div>
          <DepartmentImages
            deptId={dept.id}
            logoOverride={dept.override.logoUrl}
            bannerOverride={dept.override.bannerUrl}
            logoInherited={dept.master.logoUrl}
            bannerInherited={dept.master.bannerUrl}
          />
        </section>

        <section style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.orgadmin.deptMembers}</h2>
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.orgadmin.deptMembersHint}</p>
          </div>
          <DepartmentMemberManager
            organizationId={dept.organizationId}
            municipalityId={dept.municipalityId}
            members={members}
            currentUserId={user.id}
          />
        </section>
      </div>
    </AdminShell>
  );
}
