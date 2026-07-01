import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type GeoFylke = { fylkesnavn: string; fylkesnummer: string };
type GeoKommune = { kommunenavn: string; kommunenavnNorsk?: string; kommunenummer: string };

/**
 * POST /api/kommuner/refresh — platform-admin only. Fetches the current
 * municipality + county lists from Kartverket/Geonorge and upserts them into
 * the `no_municipalities` reference catalog. RLS on the table (platform-admin
 * write) is the real authorisation gate; we also check up front for a clear 403.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_platform_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let rows: { kommunenummer: string; name: string; fylke: string | null; fylkesnummer: string }[];
  try {
    const [fylkerRes, kommunerRes] = await Promise.all([
      fetch("https://ws.geonorge.no/kommuneinfo/v1/fylker", { cache: "no-store" }),
      fetch("https://ws.geonorge.no/kommuneinfo/v1/kommuner", { cache: "no-store" }),
    ]);
    if (!fylkerRes.ok || !kommunerRes.ok) throw new Error("geonorge_http_error");
    const fylker = (await fylkerRes.json()) as GeoFylke[];
    const kommuner = (await kommunerRes.json()) as GeoKommune[];
    const fmap = new Map(fylker.map((f) => [f.fylkesnummer, f.fylkesnavn]));
    rows = kommuner.map((k) => {
      const fnr = k.kommunenummer.slice(0, 2);
      return {
        kommunenummer: k.kommunenummer,
        name: k.kommunenavnNorsk || k.kommunenavn,
        fylke: fmap.get(fnr) ?? null,
        fylkesnummer: fnr,
      };
    });
  } catch (err) {
    console.error("kommuner refresh fetch failed", err);
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }

  const { error } = await supabase
    .from("no_municipalities")
    .upsert(rows, { onConflict: "kommunenummer" });
  if (error) {
    console.error("kommuner refresh upsert failed", error);
    return NextResponse.json({ error: "upsert_failed" }, { status: 500 });
  }

  return NextResponse.json({ count: rows.length });
}
