import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncFeed } from "@/lib/feeds";
import { clientIp, enforceRateLimit, limitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** POST /api/integrations/feeds/:id/sync — manual "Synk nå" for the feed owner. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ipLimited = enforceRateLimit({
    bucket: "api_integrations_feed_sync_ip",
    key: limitKey([clientIp(_req)]),
    max: 20,
    windowMs: 60_000,
  });
  if (ipLimited) return ipLimited;

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const userLimited = enforceRateLimit({
    bucket: "api_integrations_feed_sync_user",
    key: limitKey([user.id, id]),
    max: 5,
    windowMs: 60_000,
  });
  if (userLimited) return userLimited;

  // RLS on calendar_feeds (is_org_member) means a non-owner sees no row → 403.
  const { data: feed } = await supabase.from("calendar_feeds").select("id").eq("id", id).maybeSingle();
  if (!feed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const result = await syncFeed(id);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
