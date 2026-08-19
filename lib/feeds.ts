import { createAdminClient } from "@/lib/supabase/admin";
import { parseIcs } from "@/lib/ics";
import { geocodeAddress } from "@/lib/geocode";
import { makeSlug, pointEwkt } from "@/lib/slug";
import { fetchCalendarFeed } from "@/lib/feed-security";

export interface SyncResult {
  ok: boolean;
  imported: number;
  created: number;
  updated: number;
  failed: number;
  durationMs: number;
  errorCategory?: "concurrent" | "database" | "external" | "network" | "parse";
  error?: string;
}

function result(startedAt: number): SyncResult {
  return { ok: true, imported: 0, created: 0, updated: 0, failed: 0, durationMs: Date.now() - startedAt };
}

function statusText(sync: SyncResult): string {
  const prefix = sync.ok ? "ok" : "error";
  return `${prefix}:created=${sync.created},updated=${sync.updated},failed=${sync.failed},duration=${sync.durationMs}ms`;
}

async function recordStatus(
  admin: ReturnType<typeof createAdminClient>,
  feedId: string,
  sync: SyncResult,
  startedAt: number,
): Promise<SyncResult> {
  sync.durationMs = Date.now() - startedAt;
  const { error } = await admin
    .from("calendar_feeds")
    .update({
      last_synced_at: new Date().toISOString(),
      last_status: statusText(sync),
      last_error: sync.error ?? sync.errorCategory ?? null,
    })
    .eq("id", feedId);
  if (error) {
    sync.ok = false;
    sync.errorCategory = "database";
    sync.error = "feed_status_failed";
  }
  return sync;
}

/**
 * Fetch a calendar feed, parse its events and upsert them into `events`
 * (idempotent on the ICS UID). Cancelled events are archived. Records the
 * outcome on the feed row. Uses the service-role client — call only from
 * trusted routes (per-feed manual sync or the cron endpoint).
 */
export async function syncFeed(feedId: string): Promise<SyncResult> {
  const startedAt = Date.now();
  const admin = createAdminClient();
  const { data: locked, error: lockError } = await admin.rpc("acquire_feed_sync_lock", {
    p_feed_id: feedId,
    p_seconds: 120,
  });
  if (lockError) return { ...result(startedAt), ok: false, errorCategory: "database", error: "feed_lock_failed" };
  if (!locked) return { ...result(startedAt), ok: false, errorCategory: "concurrent", error: "feed_sync_in_progress" };

  let sync = result(startedAt);
  try {
    const { data: feed, error: feedError } = await admin
      .from("calendar_feeds")
      .select("*")
      .eq("id", feedId)
      .maybeSingle();
    if (feedError || !feed) {
      sync = { ...sync, ok: false, errorCategory: "database", error: "feed_not_found" };
      return await recordStatus(admin, feedId, sync, startedAt);
    }

    let municipalityId: string | null = null;
    if (feed.profile_id) {
      const { data: profile, error: profileError } = await admin
        .from("org_profiles")
        .select("municipality_id")
        .eq("id", feed.profile_id)
        .single();
      if (profileError) {
        sync = { ...sync, ok: false, errorCategory: "database", error: "feed_profile_failed" };
        return await recordStatus(admin, feedId, sync, startedAt);
      }
      municipalityId = profile.municipality_id as string | null;
    }

    let text: string;
    try {
      text = await fetchCalendarFeed(feed.url as string);
    } catch {
      sync = { ...sync, ok: false, errorCategory: "network", error: "feed_fetch_failed" };
      return await recordStatus(admin, feedId, sync, startedAt);
    }

    let events;
    try {
      events = parseIcs(text);
    } catch {
      sync = { ...sync, ok: false, errorCategory: "parse", error: "feed_parse_failed" };
      return await recordStatus(admin, feedId, sync, startedAt);
    }

    for (const ev of events) {
      const { data: existing, error: lookupError } = await admin
        .from("events")
        .select("id,location")
        .eq("organization_id", feed.organization_id)
        .eq("source", "ics")
        .eq("external_ref", ev.uid)
        .maybeSingle();
      if (lookupError) {
        sync.ok = false;
        sync.failed++;
        sync.errorCategory = "database";
        continue;
      }

      const status = ev.cancelled ? "archived" : feed.auto_publish ? "published" : "draft";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: Record<string, any> = {
        title: ev.summary || "Uten tittel",
        description: ev.description,
        starts_at: ev.startsAt,
        ends_at: ev.endsAt,
        address: ev.location,
        category_id: feed.default_category_id,
        profile_id: feed.profile_id,
        municipality_id: municipalityId,
        status,
        source: "ics",
        external_ref: ev.uid,
      };

      // Geocode only when we don't already have coordinates and there's an
      // address — keeps re-syncs cheap and avoids hammering Geonorge.
      if (!existing?.location && ev.location) {
        try {
          const geo = await geocodeAddress(ev.location);
          if (geo) row.location = pointEwkt(geo.lat, geo.lng);
        } catch {
          sync.errorCategory = "external";
        }
      }

      if (existing) {
        const { error } = await admin.from("events").update(row).eq("id", existing.id);
        if (error) {
          sync.ok = false;
          sync.failed++;
          sync.errorCategory = "database";
          continue;
        }
        sync.updated++;
      } else {
        const { error } = await admin
          .from("events")
          .insert({ ...row, slug: makeSlug(row.title), organization_id: feed.organization_id });
        if (error) {
          sync.ok = false;
          sync.failed++;
          sync.errorCategory = "database";
          continue;
        }
        sync.created++;
      }
      sync.imported++;
    }

    return await recordStatus(admin, feedId, sync, startedAt);
  } catch {
    sync.ok = false;
    sync.errorCategory = "database";
    sync.error = "feed_sync_failed";
    return await recordStatus(admin, feedId, sync, startedAt);
  } finally {
    const { error } = await admin.rpc("release_feed_sync_lock", { p_feed_id: feedId });
    if (error) {
      console.error("Feed sync lock release failed", { feedId });
    }
  }
}
