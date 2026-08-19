import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);
let organizationId;
let feedId;

try {
  const { data: organization, error: organizationError } = await client
    .from("organizations")
    .insert({ name: "Feed lock test", slug: `feed-lock-${randomUUID()}`, status: "draft" })
    .select("id")
    .single();
  if (organizationError) throw organizationError;
  organizationId = organization.id;

  const { data: feed, error: feedError } = await client
    .from("calendar_feeds")
    .insert({ organization_id: organizationId, url: "https://example.com/feed.ics" })
    .select("id")
    .single();
  if (feedError) throw feedError;
  feedId = feed.id;

  const first = await client.rpc("acquire_feed_sync_lock", { p_feed_id: feedId, p_seconds: 120 });
  if (first.error || first.data !== true) throw first.error ?? new Error("First lock failed");

  const second = await client.rpc("acquire_feed_sync_lock", { p_feed_id: feedId, p_seconds: 120 });
  if (second.error || second.data !== false) throw second.error ?? new Error("Concurrent lock succeeded");

  const release = await client.rpc("release_feed_sync_lock", { p_feed_id: feedId });
  if (release.error) throw release.error;

  const third = await client.rpc("acquire_feed_sync_lock", { p_feed_id: feedId, p_seconds: 120 });
  if (third.error || third.data !== true) throw third.error ?? new Error("Lock did not release");

  console.log("Feed sync lock regression test passed");
} finally {
  if (feedId) await client.rpc("release_feed_sync_lock", { p_feed_id: feedId });
  if (organizationId) {
    const { error } = await client.from("organizations").delete().eq("id", organizationId);
    if (error) throw error;
  }
}