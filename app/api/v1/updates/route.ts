import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveApiKey, bearerToken } from "@/lib/api/auth";
import { listListingExceptions, upsertListingException, type ExceptionKind } from "@/lib/api/exceptions";
import { clientIp, enforceRateLimit, limitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = enforceRateLimit({ bucket: "api_v1_updates_post", key: limitKey([clientIp(req)]), max: 60, windowMs: 60_000 });
  if (limited) return limited;
  const key = await resolveApiKey(bearerToken(req));
  if (!key) return NextResponse.json({ error: "invalid_key" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const result = await upsertListingException(createAdminClient(), key.organizationId, body);
  return NextResponse.json(result.body, { status: result.status });
}

export async function GET(req: Request) {
  const limited = enforceRateLimit({ bucket: "api_v1_updates_get", key: limitKey([clientIp(req)]), max: 120, windowMs: 60_000 });
  if (limited) return limited;
  const key = await resolveApiKey(bearerToken(req));
  if (!key) return NextResponse.json({ error: "invalid_key" }, { status: 401 });
  const search = new URL(req.url).searchParams;
  const kind = search.get("listing_kind") as ExceptionKind | null;
  const listingId = search.get("listing_id");
  if ((kind !== "event" && kind !== "activity") || !listingId) {
    return NextResponse.json({ error: "validation_error", message: "listing_kind and listing_id are required" }, { status: 422 });
  }
  const result = await listListingExceptions(createAdminClient(), key.organizationId, kind, listingId);
  return NextResponse.json(result.body, { status: result.status });
}