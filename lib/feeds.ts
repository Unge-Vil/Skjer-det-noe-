import { createAdminClient } from "@/lib/supabase/admin";
import { parseIcs } from "@/lib/ics";
import { geocodeAddress } from "@/lib/geocode";
import { makeSlug, pointEwkt } from "@/lib/slug";

export interface SyncResult {
  ok: boolean;
  imported: number;
  error?: string;
}

/**
 * Fetch a calendar feed, parse its events and upsert them into `events`
 * (idempotent on the ICS UID). Cancelled events are archived. Records the
 * outcome on the feed row. Uses the service-role client — call only from
 * trusted routes (per-feed manual sync or the cron endpoint).
 */
export async function syncFeed(feedId: string): Promise<SyncResult> {
  const admin = createAdminClient();
  const { data: feed } = await admin.from("calendar_feeds").select("*").eq("id", feedId).maybeSingle();
  if (!feed) return { ok: false, imported: 0, error: "feed_not_found" };

  try {
    const res = await fetch(feed.url as string, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const events = parseIcs(await res.text());

    let imported = 0;
    for (const ev of events) {
      const { data: existing } = await admin
        .from("events")
        .select("id,location")
        .eq("organization_id", feed.organization_id)
        .eq("source", "ics")
        .eq("external_ref", ev.uid)
        .maybeSingle();

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
        status,
        source: "ics",
        external_ref: ev.uid,
      };

      // Geocode only when we don't already have coordinates and there's an
      // address — keeps re-syncs cheap and avoids hammering Geonorge.
      if (!existing?.location && ev.location) {
        const geo = await geocodeAddress(ev.location);
        if (geo) row.location = pointEwkt(geo.lat, geo.lng);
      }

      if (existing) {
        await admin.from("events").update(row).eq("id", existing.id);
      } else {
        await admin
          .from("events")
          .insert({ ...row, slug: makeSlug(row.title), organization_id: feed.organization_id });
      }
      imported++;
    }

    await admin
      .from("calendar_feeds")
      .update({ last_synced_at: new Date().toISOString(), last_status: `ok:${imported}`, last_error: null })
      .eq("id", feedId);
    return { ok: true, imported };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    await admin
      .from("calendar_feeds")
      .update({ last_synced_at: new Date().toISOString(), last_status: "error", last_error: msg })
      .eq("id", feedId);
    return { ok: false, imported: 0, error: msg };
  }
}
