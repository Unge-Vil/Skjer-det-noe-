"use server";

import { cookies } from "next/headers";

export async function setActiveProfile(profileId: string, organizationId?: string) {
  const store = await cookies();
  store.set("sdn-active-profile", profileId, { path: "/", maxAge: 31536000, sameSite: "lax" });
  if (organizationId) {
    store.set("sdn-active-org", organizationId, { path: "/", maxAge: 31536000, sameSite: "lax" });
  }
}
