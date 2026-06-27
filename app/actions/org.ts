"use server";

import { cookies } from "next/headers";

/** Remember which organisation the user is currently managing. */
export async function setActiveOrg(orgId: string) {
  (await cookies()).set("sdn-active-org", orgId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
