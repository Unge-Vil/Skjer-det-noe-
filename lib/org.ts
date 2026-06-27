import { createClient } from "@/lib/supabase/server";

export interface MyOrg {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  municipalities: { id: string; name: string }[];
}

/** The current user's organisation (first membership), with its municipalities. */
export async function getMyOrg(): Promise<MyOrg | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("organization_members")
    .select(
      "organizations(id, name, slug, status, description, website, email, phone, address, logo_url, organization_municipalities(municipalities(id, name)))",
    )
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const org = (data as any)?.organizations;
  if (!org) return null;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    status: org.status,
    description: org.description ?? null,
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
