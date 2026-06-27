import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_ORG_COOKIE = "sdn-active-org";

export interface OrgRef {
  id: string;
  name: string;
  slug: string;
}

export interface MyOrg {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string | null;
  descriptionEn: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  municipalities: { id: string; name: string }[];
}

const ORG_SELECT =
  "organizations(id, name, slug, status, description, description_en, website, email, phone, address, logo_url, organization_municipalities(municipalities(id, name)))";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrg(org: any): MyOrg {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    status: org.status,
    description: org.description ?? null,
    descriptionEn: org.description_en ?? null,
    website: org.website ?? null,
    email: org.email ?? null,
    phone: org.phone ?? null,
    address: org.address ?? null,
    logoUrl: org.logo_url ?? null,
    municipalities: (org.organization_municipalities ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((om: any) => om.municipalities)
      .filter(Boolean)
      .map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })),
  };
}

/** All organisations the current user is a member of (for the switcher). */
export async function getMyOrgs(): Promise<OrgRef[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("organization_members")
    .select("organizations(id, name, slug)")
    .eq("user_id", user.id);
  return (data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => r.organizations)
    .filter(Boolean)
    .map((o: OrgRef) => ({ id: o.id, name: o.name, slug: o.slug }));
}

/** The active organisation (from the cookie, else the first membership). */
export async function getMyOrg(): Promise<MyOrg | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("organization_members")
    .select(ORG_SELECT)
    .eq("user_id", user.id);

  const orgs = (data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => r.organizations)
    .filter(Boolean);
  if (orgs.length === 0) return null;

  const activeId = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  const chosen = orgs.find((o: { id: string }) => o.id === activeId) ?? orgs[0];
  return mapOrg(chosen);
}
