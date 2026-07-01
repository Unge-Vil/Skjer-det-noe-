import { createClient } from "@/lib/supabase/server";

/** Which admin areas the current user can reach. */
export interface AccessAreas {
  org: boolean; // organisation member or department member → /admin
  municipality: boolean; // municipality admin (or platform) → /kommune
  platform: boolean; // platform admin → /plattform
}

export async function getAccessAreas(): Promise<AccessAreas> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { org: false, municipality: false, platform: false };

  const [orgRes, profRes, muniRes, { data: profile }] = await Promise.all([
    supabase.from("organization_members").select("organization_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("org_profile_members").select("profile_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("municipality_admins").select("user_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("profiles").select("is_platform_admin").eq("id", user.id).maybeSingle(),
  ]);

  const platform = Boolean(profile?.is_platform_admin);
  return {
    org: (orgRes.count ?? 0) > 0 || (profRes.count ?? 0) > 0,
    // Platform admins don't auto-get municipality access; only specific admins.
    municipality: (muniRes.count ?? 0) > 0,
    platform,
  };
}

/** First area to send a user to after login (org → kommune → plattform). */
export function primaryArea(a: AccessAreas): string | null {
  if (a.org) return "/admin";
  if (a.municipality) return "/kommune";
  if (a.platform) return "/plattform";
  return null;
}
