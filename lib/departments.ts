import { createClient } from "@/lib/supabase/server";
import { parseSocialLinks, type SocialLinks } from "@/components/ds/socials";

/** Profile fields a department can either inherit from the master org or override. */
export interface DepartmentFields {
  description: string | null;
  descriptionEn: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  socialLinks: SocialLinks | null;
}

export interface DepartmentListItem {
  id: string;
  organizationId: string;
  municipalityId: string;
  organizationName: string;
  municipalityName: string;
}

export interface DepartmentDetail extends DepartmentListItem {
  organizationSlug: string;
  municipalitySlug: string;
  master: DepartmentFields;
  override: DepartmentFields; // null fields = inherit from master
}

const DEPT_SELECT =
  "id,organization_id,municipality_id," +
  "description,description_en,website,email,phone,address,logo_url,banner_url,social_links," +
  "municipalities(name,slug)," +
  "organizations(name,slug,description,description_en,website,email,phone,address,logo_url,banner_url,social_links)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fieldsFromRow(row: any): DepartmentFields {
  return {
    description: row.description ?? null,
    descriptionEn: row.description_en ?? null,
    website: row.website ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    logoUrl: row.logo_url ?? null,
    bannerUrl: row.banner_url ?? null,
    socialLinks: row.social_links == null ? null : parseSocialLinks(row.social_links),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addItem(map: Map<string, DepartmentListItem>, r: any) {
  if (!r?.id) return;
  map.set(r.id, {
    id: r.id,
    organizationId: r.organization_id,
    municipalityId: r.municipality_id,
    organizationName: r.organizations?.name ?? "",
    municipalityName: r.municipalities?.name ?? "",
  });
}

/** Departments the current user may administer: every department of orgs they
 *  are a master member of, plus departments they belong to directly. */
export async function getMyDepartments(): Promise<DepartmentListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: memberOrgs }, { data: deptMems }] = await Promise.all([
    supabase.from("organization_members").select("organization_id").eq("user_id", user.id),
    supabase.from("org_municipality_members").select("organization_id,municipality_id").eq("user_id", user.id),
  ]);

  const orgIds = (memberOrgs ?? []).map((r) => r.organization_id as string);
  const deptPairs = deptMems ?? [];
  const result = new Map<string, DepartmentListItem>();
  const listSelect = "id,organization_id,municipality_id,organizations(name),municipalities(name)";

  if (orgIds.length) {
    const { data } = await supabase
      .from("organization_municipalities")
      .select(listSelect)
      .in("organization_id", orgIds);
    for (const r of data ?? []) addItem(result, r);
  }

  if (deptPairs.length) {
    const dOrgIds = [...new Set(deptPairs.map((d) => d.organization_id as string))];
    const wanted = new Set(deptPairs.map((d) => `${d.organization_id}:${d.municipality_id}`));
    const { data } = await supabase
      .from("organization_municipalities")
      .select(listSelect)
      .in("organization_id", dOrgIds);
    for (const r of data ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rr = r as any;
      if (wanted.has(`${rr.organization_id}:${rr.municipality_id}`)) addItem(result, rr);
    }
  }

  return [...result.values()].sort((a, b) =>
    (a.organizationName + a.municipalityName).localeCompare(b.organizationName + b.municipalityName, "nb"),
  );
}

/** Full department detail (master + override) by surrogate id. */
export async function getDepartment(deptId: string): Promise<DepartmentDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_municipalities")
    .select(DEPT_SELECT)
    .eq("id", deptId)
    .maybeSingle();
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  if (!row.organizations) return null; // not allowed to read the parent org

  return {
    id: row.id,
    organizationId: row.organization_id,
    municipalityId: row.municipality_id,
    organizationName: row.organizations.name ?? "",
    organizationSlug: row.organizations.slug ?? "",
    municipalitySlug: row.municipalities?.slug ?? "",
    municipalityName: row.municipalities?.name ?? "",
    master: fieldsFromRow(row.organizations),
    override: fieldsFromRow(row),
  };
}

/** Effective value for a field: the override when set, else the master value. */
export function effective<K extends keyof DepartmentFields>(
  d: { master: DepartmentFields; override: DepartmentFields },
  key: K,
): DepartmentFields[K] {
  const ov = d.override[key];
  return ov == null ? d.master[key] : ov;
}
