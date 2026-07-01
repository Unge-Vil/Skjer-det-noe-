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
  socialLinks: SocialLinks;
}

/** Municipalities the current user specifically administers. Platform admins do
 *  NOT get all municipalities here — they never auto-enter a municipality they
 *  don't administer (platform-wide work lives on /plattform). */
export async function getMyMunicipalities(): Promise<MuniRef[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

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
    .select(
      "id,name,slug,kommunenummer,county,description,description_en,description_doc,description_doc_en,website,email,phone,address,social_links",
    )
    .eq("id", chosen.id)
    .maybeSingle();
  if (!data) return null;

  return {
    id: data.id as string,
    name: data.name as string,
    slug: data.slug as string,
    kommunenummer: data.kommunenummer as string,
    county: (data.county as string) ?? null,
    description: (data.description as string) ?? null,
    descriptionEn: (data.description_en as string) ?? null,
    descriptionDoc: data.description_doc ?? null,
    descriptionDocEn: data.description_doc_en ?? null,
    website: (data.website as string) ?? null,
    email: (data.email as string) ?? null,
    phone: (data.phone as string) ?? null,
    address: (data.address as string) ?? null,
    socialLinks: parseSocialLinks(data.social_links),
  };
}
