import { createClient } from "@/lib/supabase/server";

export type OrgAnalytics = {
  total_views: number;
  organization_views: number;
  activity_views: number;
  event_views: number;
  previous_total_views: number;
};

export async function getOrgAnalytics(orgId: string): Promise<OrgAnalytics | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("org_analytics_30d", { p_org: orgId });
  if (error || !data?.[0]) return null;
  return data[0] as OrgAnalytics;
}

export async function getMunicipalityAnalytics(municipalityId: string): Promise<OrgAnalytics | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("municipality_analytics_30d", { p_municipality: municipalityId });
  if (error || !data?.[0]) return null;
  return data[0] as OrgAnalytics;
}

export type PlatformAnalytics = Omit<OrgAnalytics, "previous_total_views"> & {
  previous_total_views: number;
};

export async function getPlatformAnalytics(): Promise<PlatformAnalytics | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("platform_analytics_30d");
  if (error || !data?.[0]) return null;
  return data[0] as PlatformAnalytics;
}