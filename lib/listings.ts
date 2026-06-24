import type { SupabaseClient } from "@supabase/supabase-js";
import {
  activityToListing,
  eventToListing,
  type Listing,
  type NearbyActivity,
  type NearbyEvent,
} from "./types";

/** Default map center: Karmøy. */
export const DEFAULT_CENTER = { lat: 59.2792, lng: 5.3015 };
export const DEFAULT_RADIUS_M = 15000;

export interface NearbyFilters {
  lat: number;
  lng: number;
  radiusM?: number;
  category?: string | null;
  municipality?: string | null;
}

/**
 * Fetch recurring activities and upcoming events near a point, merged into a
 * single distance-sorted list. Works with either the browser or server client.
 */
export async function fetchNearbyListings(
  supabase: SupabaseClient,
  filters: NearbyFilters,
): Promise<Listing[]> {
  const params = {
    p_lat: filters.lat,
    p_lng: filters.lng,
    p_radius_m: filters.radiusM ?? DEFAULT_RADIUS_M,
    p_category: filters.category ?? null,
    p_municipality: filters.municipality ?? null,
  };

  const [activitiesRes, eventsRes] = await Promise.all([
    supabase.rpc("nearby_activities", params),
    supabase.rpc("nearby_events", params),
  ]);

  if (activitiesRes.error) throw activitiesRes.error;
  if (eventsRes.error) throw eventsRes.error;

  const activities = (activitiesRes.data as NearbyActivity[]).map(activityToListing);
  const events = (eventsRes.data as NearbyEvent[]).map(eventToListing);

  return [...activities, ...events].sort((a, b) => a.distanceM - b.distanceM);
}
