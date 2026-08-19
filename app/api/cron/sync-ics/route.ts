import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncFeed, type SyncResult } from "@/lib/feeds";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/sync-ics — syncs every active calendar feed. Guarded by an
 * `x-cron-secret` header matching CRON_SECRET. Triggered by Supabase pg_cron +
 * pg_net today; swap to a Cloudflare Cron Trigger after deploy.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: feeds, error } = await admin.from("calendar_feeds").select("id").eq("active", true);
  if (error) {
    return NextResponse.json(
      { feeds: 0, results: [], error: "feed_list_failed" },
      { status: 500 },
    );
  }

  const results: Array<{ id: string } & SyncResult> = [];
  for (const f of feeds ?? []) {
    const r = await syncFeed(f.id as string);
    results.push({ id: f.id as string, ...r });
  }
  return NextResponse.json({ feeds: results.length, results });
}
