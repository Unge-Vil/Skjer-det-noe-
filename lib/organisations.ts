import type { SupabaseClient } from "@supabase/supabase-js";

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  municipalityName: string | null;
  activityCount: number;
}

/** Published organisations with their first municipality + published activity count. */
export async function fetchOrganisations(
  supabase: SupabaseClient,
  limit?: number,
): Promise<OrgSummary[]> {
  let query = supabase
    .from("organizations")
    .select("id,name,slug,organization_municipalities(municipalities(name)),activities!activities_organization_id_fkey(count)")
    .eq("status", "published")
    .order("name");
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    municipalityName:
      row.organization_municipalities?.[0]?.municipalities?.name ?? null,
    activityCount: row.activities?.[0]?.count ?? 0,
  }));
}
