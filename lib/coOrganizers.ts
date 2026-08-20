import type { SupabaseClient } from "@supabase/supabase-js";

/** Diff and persist co-organiser links for a listing (activity or event). */
export async function syncCoOrganizers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  table: "activity_co_organizers" | "event_co_organizers",
  fkColumn: "activity_id" | "event_id",
  listingId: string,
  initialIds: string[],
  currentIds: string[],
): Promise<{ error: unknown | null }> {
  const toAdd = currentIds.filter((id) => !initialIds.includes(id));
  const toRemove = initialIds.filter((id) => !currentIds.includes(id));

  if (toRemove.length) {
    const { error } = await supabase.from(table).delete().eq(fkColumn, listingId).in("organization_id", toRemove);
    if (error) return { error };
  }
  if (toAdd.length) {
    const { error } = await supabase.from(table).insert(toAdd.map((organization_id) => ({ [fkColumn]: listingId, organization_id })));
    if (error) return { error };
  }
  return { error: null };
}
