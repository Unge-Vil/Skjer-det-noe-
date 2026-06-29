import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { parseSocialLinks, type SocialLinks } from "@/components/ds/socials";

const ACTIVE_MUNI_COOKIE = "sdn-active-muni";

export interface MuniRef {
  id: string;
  name: string;
  slug: string;
}

export interface MyMunicipality extends MuniRef {
  kommunenummer: string;
  county: string | null;
  socialLinks: SocialLinks;
}

/** Municipalities the current user may administer (all of them for platform admins). */
export async function getMyMunicipalities(): Promise<MuniRef[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_platform_admin) {
    const { data } = await supabase.from("municipalities_view").select("id,name,slug").order("name");
    return (data as MuniRef[]) ?? [];
  }

  const { data } = await supabase
    .from("municipality_admins")
    .select("municipalities(id,name,slug)")
    .eq("user_id", user.id);
  return (data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => r.municipalities)
    .filter(Boolean)
    .map((m: MuniRef) => ({ id: m.id, name: m.name, slug: m.slug }));
}

/** The active municipality (cookie, else the first the user administers). */
export async function getActiveMunicipality(): Promise<MyMunicipality | null> {
  const munis = await getMyMunicipalities();
  if (munis.length === 0) return null;

  const activeId = (await cookies()).get(ACTIVE_MUNI_COOKIE)?.value;
  const chosen = munis.find((m) => m.id === activeId) ?? munis[0];

  const supabase = await createClient();
  const { data } = await supabase
    .from("municipalities")
    .select("id,name,slug,kommunenummer,county,social_links")
    .eq("id", chosen.id)
    .maybeSingle();
  if (!data) return null;

  return {
    id: data.id as string,
    name: data.name as string,
    slug: data.slug as string,
    kommunenummer: data.kommunenummer as string,
    county: (data.county as string) ?? null,
    socialLinks: parseSocialLinks(data.social_links),
  };
}
