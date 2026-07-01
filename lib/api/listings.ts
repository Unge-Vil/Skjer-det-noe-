import type { SupabaseClient } from "@supabase/supabase-js";
import { makeSlug, pointEwkt } from "@/lib/slug";

export type ListingKind = "event" | "activity";

export interface ApiResult {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Body = Record<string, any>;

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const int = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

function bad(message: string, details?: unknown): ApiResult {
  return { status: 422, body: { error: "validation_error", message, details } };
}

/** Resolve friendly identifiers (slugs / kommunenummer) to foreign keys. */
async function resolveRefs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: SupabaseClient<any>,
  orgId: string,
  body: Body,
): Promise<{ category_id: string | null; municipality_id: string | null; profile_id: string | null } | ApiResult> {
  let category_id: string | null = null;
  let municipality_id: string | null = null;
  let profile_id: string | null = null;

  const category = str(body.category);
  if (category) {
    const { data } = await db.from("categories").select("id").eq("slug", category).maybeSingle();
    if (!data) return bad(`Unknown category slug: ${category}`);
    category_id = data.id as string;
  }

  const municipality = str(body.municipality);
  if (municipality) {
    const { data } = await db
      .from("municipalities")
      .select("id")
      .or(`kommunenummer.eq.${municipality},slug.eq.${municipality}`)
      .maybeSingle();
    if (!data) return bad(`Unknown municipality (kommunenummer or slug): ${municipality}`);
    municipality_id = data.id as string;
  }

  const profile = str(body.profile);
  if (profile) {
    const { data } = await db
      .from("org_profiles")
      .select("id")
      .eq("organization_id", orgId)
      .eq("slug", profile)
      .maybeSingle();
    if (!data) return bad(`Unknown profile slug for this organisation: ${profile}`);
    profile_id = data.id as string;
  }

  return { category_id, municipality_id, profile_id };
}

function locationEwkt(body: Body): string | null | ApiResult {
  const loc = body.location;
  if (loc == null) return null;
  if (typeof loc !== "object" || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
    return bad("location must be an object { lat: number, lng: number }");
  }
  return pointEwkt(loc.lat, loc.lng);
}

/**
 * Validate + normalise an inbound API body into a listings row and upsert it,
 * scoped to `orgId`. Idempotent on `external_ref` (per org + source). Returns a
 * ready-to-serve `{ status, body }`.
 */
export async function upsertListingFromApi(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: SupabaseClient<any>,
  orgId: string,
  autoPublish: boolean,
  kind: ListingKind,
  body: Body,
  source = "api",
): Promise<ApiResult> {
  const title = str(body.title);
  if (!title) return bad("title is required");

  const refs = await resolveRefs(db, orgId, body);
  if ("status" in refs) return refs;

  const location = locationEwkt(body);
  if (location && typeof location === "object") return location; // ApiResult error

  const externalRef = str(body.external_ref);
  const table = kind === "event" ? "events" : "activities";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: Record<string, any> = {
    title,
    title_en: str(body.title_en),
    description: str(body.description),
    description_en: str(body.description_en),
    category_id: refs.category_id,
    municipality_id: refs.municipality_id,
    profile_id: refs.profile_id,
    address: str(body.address),
    location: (location as string | null) ?? null,
    age_min: int(body.age_min),
    age_max: int(body.age_max),
    price: str(body.price),
    url: str(body.url),
    image_url: str(body.image_url),
    status: autoPublish ? "published" : "draft",
    source,
    external_ref: externalRef,
  };

  if (kind === "event") {
    const startsAt = str(body.starts_at);
    if (!startsAt) return bad("starts_at is required for events (ISO 8601)");
    const d = new Date(startsAt);
    if (Number.isNaN(d.getTime())) return bad(`starts_at is not a valid date: ${startsAt}`);
    row.starts_at = d.toISOString();
    const endsAt = str(body.ends_at);
    row.ends_at = endsAt ? new Date(endsAt).toISOString() : null;
  } else {
    row.weekday = int(body.weekday);
    row.start_time = str(body.start_time);
    row.end_time = str(body.end_time);
    row.recurrence_note = str(body.recurrence_note);
  }

  // Idempotent upsert on external_ref (partial unique index isn't a usable
  // ON CONFLICT arbiter via PostgREST, so do a manual find-then-update/insert).
  if (externalRef) {
    const { data: existing } = await db
      .from(table)
      .select("id,slug")
      .eq("organization_id", orgId)
      .eq("source", source)
      .eq("external_ref", externalRef)
      .maybeSingle();
    if (existing) {
      const { error } = await db.from(table).update(row).eq("id", existing.id);
      if (error) return { status: 500, body: { error: "db_error", message: error.message } };
      return { status: 200, body: publicPayload(kind, existing.id as string, existing.slug as string, row.status) };
    }
  }

  const slug = makeSlug(title);
  const { data, error } = await db
    .from(table)
    .insert({ ...row, slug, organization_id: orgId })
    .select("id,slug")
    .single();
  if (error) return { status: 500, body: { error: "db_error", message: error.message } };
  return { status: 201, body: publicPayload(kind, data.id as string, data.slug as string, row.status) };
}

function publicPayload(kind: ListingKind, id: string, slug: string, status: string) {
  const path = kind === "event" ? "arrangement" : "aktivitet";
  return { id, slug, status, url: `/${path}/${slug}` };
}

/** List an org's own API/ICS-visible rows (paged, newest first). */
export async function listOrgListings(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: SupabaseClient<any>,
  orgId: string,
  kind: ListingKind,
  limit: number,
): Promise<ApiResult> {
  const table = kind === "event" ? "events" : "activities";
  const order = kind === "event" ? "starts_at" : "created_at";
  const { data, error } = await db
    .from(table)
    .select("id,slug,title,status,source,external_ref,created_at")
    .eq("organization_id", orgId)
    .order(order, { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));
  if (error) return { status: 500, body: { error: "db_error", message: error.message } };
  return { status: 200, body: { data } };
}
