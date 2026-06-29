import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyDepartments, getDepartment } from "@/lib/departments";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { AdminShell, type NavItem } from "@/components/admin/AdminShell";
import { ShellIdentity } from "@/components/admin/ShellIdentity";
import { DepartmentForm } from "@/components/admin/DepartmentForm";
import { DepartmentImages } from "@/components/admin/DepartmentImages";
import { DepartmentMemberManager } from "@/components/admin/DepartmentMemberManager";

export const dynamic = "force-dynamic";

type Member = { user_id: string; email: string; role: string };
type ListingRow = { id: string; title: string; status: string };

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

  const [{ data: memberRows }, { data: actRows }, { data: evtRows }] = await Promise.all([
    supabase.rpc("list_department_members", { p_org: dept.organizationId, p_muni: dept.municipalityId }),
    supabase
      .from("activities")
      .select("id,title,status")
      .eq("organization_id", dept.organizationId)
      .eq("municipality_id", dept.municipalityId)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id,title,status")
      .eq("organization_id", dept.organizationId)
      .eq("municipality_id", dept.municipalityId)
      .order("starts_at", { ascending: true }),
  ]);
  const members = (memberRows as Member[]) ?? [];
  const activities = (actRows as ListingRow[]) ?? [];
  const events = (evtRows as ListingRow[]) ?? [];

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

        <ListingSection
          title={t.admin.activities}
          newHref={`/admin/aktivitet/ny?dept=${dept.id}`}
          newLabel={t.admin.newActivity}
          editBase="/admin/aktivitet"
          empty={t.admin.noActivities}
          rows={activities}
          deptId={dept.id}
          publishedLabel={t.admin.statusPublished}
          draftLabel={t.admin.statusDraft}
        />

        <ListingSection
          title={t.admin.events}
          newHref={`/admin/arrangement/ny?dept=${dept.id}`}
          newLabel={t.admin.newEvent}
          editBase="/admin/arrangement"
          empty={t.admin.noEvents}
          rows={events}
          deptId={dept.id}
          publishedLabel={t.admin.statusPublished}
          draftLabel={t.admin.statusDraft}
        />

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

function ListingSection({
  title,
  newHref,
  newLabel,
  editBase,
  empty,
  rows,
  deptId,
  publishedLabel,
  draftLabel,
}: {
  title: string;
  newHref: string;
  newLabel: string;
  editBase: string;
  empty: string;
  rows: ListingRow[];
  deptId: string;
  publishedLabel: string;
  draftLabel: string;
}) {
  return (
    <section style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="flex items-center justify-between">
        <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{title}</h2>
        <Link href={newHref}>
          <Button variant="secondary" size="sm" leadingIcon="plus">{newLabel}</Button>
        </Link>
      </div>
      {rows.length === 0 ? (
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{empty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <Link key={r.id} href={`${editBase}/${r.id}?dept=${deptId}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div
                className="flex items-center justify-between gap-3"
                style={{ background: "var(--surface-sunk)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}
              >
                <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                    {r.status === "published" ? publishedLabel : draftLabel}
                  </span>
                  <Icon name="pencil" size={15} color="var(--text-muted)" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
