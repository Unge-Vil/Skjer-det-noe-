"use server";

import { cookies } from "next/headers";

/** Remember which organisation the user is currently managing. */
export async function setActiveOrg(orgId: string) {
  const store = await cookies();
  store.set("sdn-active-org", orgId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  // Selecting the parent organisation exits any department/profile context.
  store.delete("sdn-active-profile");
}
