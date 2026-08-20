import type { SupabaseClient } from "@supabase/supabase-js";

export type ExceptionKind = "event" | "activity";
export type ExceptionStatus = "cancelled" | "closed" | "changed" | "notice";

type Body = Record<string, unknown>;

const statuses = new Set<ExceptionStatus>(["cancelled", "closed", "changed", "notice"]);

function stringValue(value: unknown, max = 2_000): string | null {
  return typeof value === "string" && value.trim() && value.trim().length <= max ? value.trim() : null;
}

function bad(message: string, details?: unknown) {
  return { status: 422, body: { error: "validation_error", message, details } };
}

export async function upsertListingException(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: SupabaseClient<any>,
  organizationId: string,
  input: unknown,
  source = "api",
) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return bad("Body must be an object");
  const body = input as Body;
  const kind = body.listing_kind;
  const listingId = stringValue(body.listing_id, 100);
  const occurrenceDate = stringValue(body.occurrence_date, 10);
  const exceptionKind = body.kind;

  if (kind !== "event" && kind !== "activity") return bad("listing_kind must be event or activity");
  if (!listingId) return bad("listing_id is required");
  if (!occurrenceDate || !/^\d{4}-\d{2}-\d{2}$/.test(occurrenceDate) || Number.isNaN(Date.parse(`${occurrenceDate}T00:00:00Z`))) {
    return bad("occurrence_date must use YYYY-MM-DD");
  }
  if (typeof exceptionKind !== "string" || !statuses.has(exceptionKind as ExceptionStatus)) {
    return bad("kind must be cancelled, closed, changed or notice");
  }

  const table = kind === "event" ? "events" : "activities";
  const { data: listing, error: listingError } = await db.from(table).select("id").eq("id", listingId).eq("organization_id", organizationId).maybeSingle();
  if (listingError) return { status: 500, body: { error: "internal_error", message: "Failed to find listing" } };
  if (!listing) return { status: 404, body: { error: "not_found", message: "Listing not found" } };

  const startTime = stringValue(body.start_time, 8);
  const endTime = stringValue(body.end_time, 8);
  if ((startTime && !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(startTime)) || (endTime && !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(endTime))) {
    return bad("start_time and end_time must use HH:MM or HH:MM:SS");
  }
  if ((startTime == null) !== (endTime == null)) return bad("start_time and end_time must be provided together");

  const externalRef = stringValue(body.external_ref, 255);
  const row = {
    event_id: kind === "event" ? listingId : null,
    activity_id: kind === "activity" ? listingId : null,
    organization_id: organizationId,
    occurrence_date: occurrenceDate,
    kind: exceptionKind,
    message: stringValue(body.message),
    reason: stringValue(body.reason),
    start_time: startTime,
    end_time: endTime,
    source,
    external_ref: externalRef,
  };

  let existing = null;
  if (externalRef) {
    const result = await db.from("listing_exceptions").select("id").eq("organization_id", organizationId).eq("source", source).eq("external_ref", externalRef).maybeSingle();
    existing = result.data;
  }
  if (!existing) {
    const result = await db.from("listing_exceptions").select("id").eq(kind === "event" ? "event_id" : "activity_id", listingId).eq("occurrence_date", occurrenceDate).maybeSingle();
    existing = result.data;
  }

  if (existing) {
    const { data, error } = await db.from("listing_exceptions").update(row).eq("id", existing.id).select("*").single();
    return error ? { status: 500, body: { error: "internal_error", message: "Failed to save exception" } } : { status: 200, body: { data } };
  }
  const { data, error } = await db.from("listing_exceptions").insert(row).select("*").single();
  return error ? { status: 500, body: { error: "internal_error", message: "Failed to save exception" } } : { status: 201, body: { data } };
}

export async function listListingExceptions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: SupabaseClient<any>,
  organizationId: string,
  kind: ExceptionKind,
  listingId: string,
) {
  const table = kind === "event" ? "events" : "activities";
  const { data: listing } = await db.from(table).select("id").eq("id", listingId).eq("organization_id", organizationId).maybeSingle();
  if (!listing) return { status: 404, body: { error: "not_found", message: "Listing not found" } };
  const { data, error } = await db.from("listing_exceptions").select("*").eq(kind === "event" ? "event_id" : "activity_id", listingId).order("occurrence_date");
  return error ? { status: 500, body: { error: "internal_error", message: "Failed to list exceptions" } } : { status: 200, body: { data } };
}