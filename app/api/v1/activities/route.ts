import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveApiKey, bearerToken } from "@/lib/api/auth";
import { upsertListingFromApi, listOrgListings } from "@/lib/api/listings";
import { clientIp, enforceRateLimit, limitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** POST /api/v1/activities — create/update an activity (Bearer sdn_live_… key). */
export async function POST(req: Request) {
  const ipLimited = enforceRateLimit({
    bucket: "api_v1_activities_post_ip",
    key: limitKey([clientIp(req)]),
    max: 60,
    windowMs: 60_000,
  });
  if (ipLimited) return ipLimited;

  const key = await resolveApiKey(bearerToken(req));
  if (!key) return NextResponse.json({ error: "invalid_key" }, { status: 401 });

  const keyLimited = enforceRateLimit({
    bucket: "api_v1_activities_post_key",
    key: limitKey([key.id]),
    max: 30,
    windowMs: 60_000,
  });
  if (keyLimited) return keyLimited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const admin = createAdminClient();
  const result = await upsertListingFromApi(admin, key.organizationId, key.autoPublish, "activity", body);
  return NextResponse.json(result.body, { status: result.status });
}

/** GET /api/v1/activities — list this key's activities. */
export async function GET(req: Request) {
  const ipLimited = enforceRateLimit({
    bucket: "api_v1_activities_get_ip",
    key: limitKey([clientIp(req)]),
    max: 120,
    windowMs: 60_000,
  });
  if (ipLimited) return ipLimited;

  const key = await resolveApiKey(bearerToken(req));
  if (!key) return NextResponse.json({ error: "invalid_key" }, { status: 401 });

  const keyLimited = enforceRateLimit({
    bucket: "api_v1_activities_get_key",
    key: limitKey([key.id]),
    max: 120,
    windowMs: 60_000,
  });
  if (keyLimited) return keyLimited;

  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "50");
  const admin = createAdminClient();
  const result = await listOrgListings(admin, key.organizationId, "activity", Number.isFinite(limit) ? limit : 50);
  return NextResponse.json(result.body, { status: result.status });
}
