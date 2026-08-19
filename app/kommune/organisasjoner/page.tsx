import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { getActiveMunicipality } from "@/lib/kommune";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon } from "@/components/ds/Icon";
import { OrgStatusButton } from "@/components/admin/OrgStatusButton";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { kommuneNav } from "@/components/admin/kommuneNav";

export const dynamic = "force-dynamic";

type Org = {
  id: string;
  slug: string;
  name: string;
  status: string;
  org_number: string | null;
  is_volunteer: boolean;
};

export default async function KommuneOrganisationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const active = await getActiveMunicipality();
  if (!active) redirect("/kommune");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = params.status === "draft" || params.status === "published" ? params.status : "";
  const sort = params.sort === "status" ? params.sort : "name";
  const supabase = await createClient();

  const { data } = await supabase
    .from("organization_municipalities")
    .select("organizations(id,name,slug,status,org_number,is_volunteer)")
    .eq("municipality_id", active.id);

  const byId = new Map<string, Org>();
  for (const row of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const org = (row as any).organizations as Org | null;
    if (org) byId.set(org.id, org);
  }

  const organisations = [...byId.values()]
    .filter((org) => !status || org.status === status)
    .filter((org) => {
      if (!query) return true;
      const haystack = `${org.name} ${org.org_number ?? ""}`.toLocaleLowerCase();
      return haystack.includes(query.toLocaleLowerCase());
    })
    .sort((a, b) => sort === "status" ? a.status.localeCompare(b.status) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name, locale));

  return (
    <AdminShell
      title={t.kommune.organizations}
      identity={<ContextSwitcher />}
      nav={kommuneNav(t, "/kommune/organisasjoner")}
    >
      <main id="main" className="mx-auto w-full max-w-5xl" style={{ padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.kommune.organizations}</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.kommune.organizationsSubtitle}</p>
        </div>

        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end" style={{ marginBottom: 18 }}>
          <label className="flex min-w-0 flex-1 flex-col gap-1" style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--text-muted)" }}>
            {t.kommune.organizationsSearch}
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t.kommune.organizationsSearch}
              style={{ width: "100%", minHeight: 42, padding: "9px 12px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", color: "var(--text-body)", fontSize: "var(--fs-sm)" }}
            />
          </label>
          <label className="flex flex-col gap-1 sm:w-52" style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--text-muted)" }}>
            {t.kommune.organizationsFilter}
            <select
              name="status"
              defaultValue={status}
              style={{ minHeight: 42, padding: "9px 12px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", color: "var(--text-body)", fontSize: "var(--fs-sm)" }}
            >
              <option value="">{t.kommune.allStatuses}</option>
              <option value="draft">{t.kommune.notApprovedFilter}</option>
              <option value="published">{t.kommune.approvedFilter}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 sm:w-44" style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--text-muted)" }}>
            Sorter etter
            <select name="sort" defaultValue={sort} style={{ minHeight: 42, padding: "9px 12px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", color: "var(--text-body)", fontSize: "var(--fs-sm)" }}>
              <option value="name">Navn</option>
              <option value="status">Status</option>
            </select>
          </label>
          <button type="submit" style={{ minHeight: 42, padding: "9px 16px", border: "1px solid var(--fjord-700)", borderRadius: "var(--radius-md)", background: "var(--fjord-700)", color: "white", fontWeight: 700, cursor: "pointer" }}>
            Søk
          </button>
        </form>

        <div style={{ marginBottom: 10, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          {organisations.length} {t.kommune.organizationCount}
        </div>
        {organisations.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.kommune.noOrganizations}</p>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-card)" }}>
            <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: "var(--fs-sm)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", textAlign: "left", fontSize: "var(--fs-xs)" }}>
                  <th style={{ padding: "11px 16px" }}>Organisasjon</th>
                  <th style={{ padding: "11px 16px" }}>{t.kommune.orgNumber}</th>
                  <th style={{ padding: "11px 16px" }}>{t.kommune.organizationsFilter}</th>
                  <th style={{ padding: "11px 16px", textAlign: "right" }}>Handling</th>
                </tr>
              </thead>
              <tbody>
                {organisations.map((org) => (
                  <tr key={org.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "13px 16px", fontWeight: 700 }}>
                      <Link href={`/organisasjon/${org.slug}`} style={{ color: "var(--text-link)", textDecoration: "none" }}>{org.name}</Link>
                      {org.is_volunteer && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 3, color: "var(--text-muted)", fontSize: "var(--fs-xs)", fontWeight: 500 }}>
                          <Icon name="sparkles" size={12} /> {t.kommune.volunteer}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px", color: "var(--text-muted)" }}>{org.org_number ?? "–"}</td>
                    <td style={{ padding: "13px 16px" }}>{org.status === "published" ? t.kommune.approvedFilter : t.kommune.notApprovedFilter}</td>
                    <td style={{ padding: "13px 16px", textAlign: "right" }}><OrgStatusButton id={org.id} status={org.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminShell>
  );
}
