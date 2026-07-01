/**
 * Domain types for Skjer det noe.
 *
 * These mirror the public schema and the nearby_* RPC return shapes. Once the
 * Supabase MCP / CLI is connected you can generate full DB types with
 * `supabase gen types typescript` and replace the hand-written ones here.
 */

import type { Locale } from "./i18n/config";

export type ListingStatus = "draft" | "published" | "archived";

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface Municipality {
  id: string;
  kommunenummer: string;
  name: string;
  county: string | null;
  slug: string;
  lat: number | null;
  lng: number | null;
}

/** Row returned by the `nearby_activities` RPC. */
export interface NearbyActivity {
  id: string;
  title: string;
  title_en: string | null;
  slug: string;
  description: string | null;
  description_en: string | null;
  organization_name: string | null;
  category_slug: string | null;
  municipality_name: string | null;
  address: string | null;
  lat: number;
  lng: number;
  weekday: number | null;
  start_time: string | null;
  end_time: string | null;
  recurrence_note: string | null;
  age_min: number | null;
  age_max: number | null;
  price: string | null;
  url: string | null;
  image_url: string | null;
  accessibility: string | null;
  area: string | null;
  distance_m: number;
}

/** Row returned by the `nearby_events` RPC. */
export interface NearbyEvent {
  id: string;
  title: string;
  title_en: string | null;
  slug: string;
  description: string | null;
  description_en: string | null;
  organization_name: string | null;
  category_slug: string | null;
  municipality_name: string | null;
  address: string | null;
  lat: number;
  lng: number;
  starts_at: string;
  ends_at: string | null;
  age_min: number | null;
  age_max: number | null;
  price: string | null;
  url: string | null;
  image_url: string | null;
  accessibility: string | null;
  area: string | null;
  distance_m: number;
}

/** Unified shape the list + map render, regardless of source table. */
export type ListingKind = "activity" | "event";

export interface Listing {
  id: string;
  kind: ListingKind;
  title: string;
  slug: string;
  description: string | null;
  organizationName: string | null;
  categorySlug: string | null;
  municipalityName: string | null;
  address: string | null;
  lat: number;
  lng: number;
  ageMin: number | null;
  ageMax: number | null;
  price: string | null;
  url: string | null;
  imageUrl: string | null;
  accessibility?: string | null;
  area?: string | null;
  distanceM: number;
  /** Recurring activities only. */
  weekday?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  recurrenceNote?: string | null;
  /** One-off events only. */
  startsAt?: string | null;
  endsAt?: string | null;
}

/** Pick the English text when available for the en locale, else Norwegian. */
function pick(locale: Locale, nb: string | null, en: string | null): string | null {
  return locale === "en" && en ? en : nb;
}

export function activityToListing(a: NearbyActivity, locale: Locale): Listing {
  return {
    id: a.id,
    kind: "activity",
    title: pick(locale, a.title, a.title_en) ?? a.title,
    slug: a.slug,
    description: pick(locale, a.description, a.description_en),
    organizationName: a.organization_name,
    categorySlug: a.category_slug,
    municipalityName: a.municipality_name,
    address: a.address,
    lat: a.lat,
    lng: a.lng,
    ageMin: a.age_min,
    ageMax: a.age_max,
    price: a.price,
    url: a.url,
    imageUrl: a.image_url,
    accessibility: a.accessibility,
    area: a.area,
    distanceM: a.distance_m,
    weekday: a.weekday,
    startTime: a.start_time,
    endTime: a.end_time,
    recurrenceNote: a.recurrence_note,
  };
}

export function eventToListing(e: NearbyEvent, locale: Locale): Listing {
  return {
    id: e.id,
    kind: "event",
    title: pick(locale, e.title, e.title_en) ?? e.title,
    slug: e.slug,
    description: pick(locale, e.description, e.description_en),
    organizationName: e.organization_name,
    categorySlug: e.category_slug,
    municipalityName: e.municipality_name,
    address: e.address,
    lat: e.lat,
    lng: e.lng,
    ageMin: e.age_min,
    ageMax: e.age_max,
    price: e.price,
    url: e.url,
    imageUrl: e.image_url,
    accessibility: e.accessibility,
    area: e.area,
    distanceM: e.distance_m,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
  };
}
