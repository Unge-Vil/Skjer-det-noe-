import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { parseSocialLinks, type SocialLinks } from "@/components/ds/socials";

/** Fields a profile can either inherit from the master org or override. */
export interface ProfileFields {
  description: string | null;
  descriptionEn: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptionDoc: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptionDocEn: any | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  socialLinks: SocialLinks | null;
}

export interface ProfileListItem {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  municipalityId: string | null;
  municipalityName: string | null;
}

export interface ProfileDetail extends ProfileListItem {
  slug: string;
  organizationSlug: string;
  municipalitySlug: string | null;
  master: ProfileFields;
  override: ProfileFields; // null fields = inherit from master
}

const OVERRIDE_COLS =
  "description,description_en,description_doc,description_doc_en,website,email,phone,address,logo_url,banner_url,social_links";
const MASTER_COLS =
  "name,slug,description,description_en,description_doc,description_doc_en,website,email,phone,address,logo_url,banner_url,social_links";
const ACTIVE_PROFILE_COOKIE = "sdn-active-profile";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fieldsFrom(row: any): ProfileFields {
  return {
    description: row.description ?? null,
    descriptionEn: row.description_en ?? null,
    descriptionDoc: row.description_doc ?? null,
    descriptionDocEn: row.description_doc_en ?? null,
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
function listItem(r: any): ProfileListItem {
  return {
    id: r.id,
    name: r.name,
    organizationId: r.organization_id,
    organizationName: r.organizations?.name ?? "",
    municipalityId: r.municipality_id ?? null,
    municipalityName: r.municipalities?.name ?? null,
  };
}

/** Profiles the current user can administer: every profile of orgs they are a
 *  master member of, plus profiles they belong to directly. */
export async function getMyProfiles(): Promise<ProfileListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: memberOrgs }, { data: profMems }] = await Promise.all([
    supabase.from("organization_members").select("organization_id").eq("user_id", user.id),
    supabase.from("org_profile_members").select("profile_id").eq("user_id", user.id),
  ]);
  const orgIds = (memberOrgs ?? []).map((r) => r.organization_id as string);
  const profIds = (profMems ?? []).map((r) => r.profile_id as string);

  const sel = "id,organization_id,municipality_id,name,organizations(name),municipalities(name)";
  const result = new Map<string, ProfileListItem>();

  if (orgIds.length) {
    const { data } = await supabase.from("org_profiles").select(sel).in("organization_id", orgIds);
    for (const r of data ?? []) result.set((r as { id: string }).id, listItem(r));
  }
  if (profIds.length) {
    const { data } = await supabase.from("org_profiles").select(sel).in("id", profIds);
    for (const r of data ?? []) result.set((r as { id: string }).id, listItem(r));
  }

  return [...result.values()].sort((a, b) =>
    (a.organizationName + a.name).localeCompare(b.organizationName + b.name, "nb"),
  );
}

/** Full profile detail (master + override) by id. */
export async function getProfile(id: string): Promise<ProfileDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_profiles")
    .select(
      `id,organization_id,municipality_id,name,slug,${OVERRIDE_COLS},municipalities(name,slug),organizations(${MASTER_COLS})`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  if (!row.organizations) return null; // not allowed to read the parent org

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    organizationId: row.organization_id,
    organizationName: row.organizations.name ?? "",
    organizationSlug: row.organizations.slug ?? "",
    municipalityId: row.municipality_id ?? null,
    municipalityName: row.municipalities?.name ?? null,
    municipalitySlug: row.municipalities?.slug ?? null,
    master: fieldsFrom(row.organizations),
    override: fieldsFrom(row),
  };
}

/** The profile selected as the current organisation-admin context. */
export async function getActiveProfile(): Promise<ProfileDetail | null> {
  const id = (await cookies()).get(ACTIVE_PROFILE_COOKIE)?.value;
  return id ? getProfile(id) : null;
}

/** Effective value for a field: the override when set, else the master value. */
export function effective<K extends keyof ProfileFields>(
  d: { master: ProfileFields; override: ProfileFields },
  key: K,
): ProfileFields[K] {
  const ov = d.override[key];
  return ov == null ? d.master[key] : ov;
}
