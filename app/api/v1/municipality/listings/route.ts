import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bearerToken, resolveMunicipalityApiKey } from "@/lib/api/auth";
import { clientIp, enforceRateLimit, limitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type ListingKind = "activities" | "events";

/** GET /api/v1/municipality/listings — return published listings in this key's municipality. */
export async function GET(req: Request) {
  const ipLimited = enforceRateLimit({
    bucket: "api_v1_municipality_listings_get_ip",
    key: limitKey([clientIp(req)]),
    max: 120,
    windowMs: 60_000,
  });
  if (ipLimited) return ipLimited;

  const key = await resolveMunicipalityApiKey(bearerToken(req));
  if (!key) return NextResponse.json({ error: "invalid_key" }, { status: 401 });

  const keyLimited = enforceRateLimit({
    bucket: "api_v1_municipality_listings_get_key",
    key: limitKey([key.id]),
    max: 120,
    windowMs: 60_000,
  });
  if (keyLimited) return keyLimited;

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") === "events" ? "events" : "activities";
  const limitValue = Number(url.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitValue) ? Math.min(Math.max(Math.trunc(limitValue), 1), 100) : 50;
  const admin = createAdminClient();

  const columns = kind === "events"
    ? "id,slug,title,description,starts_at,ends_at,address,status,organization_id,created_at"
    : "id,slug,title,description,weekday,start_time,end_time,address,status,organization_id,created_at";
  const order = kind === "events" ? "starts_at" : "created_at";
  const { data, error } = await admin
    .from(kind as ListingKind)
    .select(columns)
    .eq("municipality_id", key.municipalityId)
    .eq("status", "published")
    .order(order, { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: "db_error", message: error.message }, { status: 500 });
  return NextResponse.json({ data, kind, limit });
}