import { createClient } from "@/lib/supabase/server";

export interface MyOrg {
  id: string;
  name: string;
  status: string;
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
      "organizations(id, name, status, organization_municipalities(municipalities(id, name)))",
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
    status: org.status,
    municipalities: (org.organization_municipalities ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((om: any) => om.municipalities)
      .filter(Boolean)
      .map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })),
  };
}
