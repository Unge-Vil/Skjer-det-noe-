"use server";

import { cookies } from "next/headers";

/** Remember which municipality the admin is currently managing. */
export async function setActiveMunicipality(muniId: string) {
  (await cookies()).set("sdn-active-muni", muniId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
