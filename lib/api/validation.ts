export type ListingKind = "event" | "activity";

type Body = Record<string, unknown>;
export interface FieldError { field: string; message: string }
export type ValidationResult =
  | { ok: true; body: Body }
  | { ok: false; errors: FieldError[] };

const STRING_LIMITS: Record<string, number> = {
  title: 255,
  title_en: 255,
  description: 10_000,
  description_en: 10_000,
  category: 100,
  municipality: 100,
  profile: 100,
  address: 500,
  accessibility: 2_000,
  area: 255,
  price: 255,
  recurrence_note: 500,
  external_ref: 255,
  start_time: 8,
  end_time: 8,
  starts_at: 50,
  ends_at: 50,
  ends_on: 20,
};

function dateValue(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function validateListingPayload(kind: ListingKind, input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: [{ field: "body", message: "must be an object" }] };
  }

  const body = { ...(input as Body) };
  const errors: FieldError[] = [];

  for (const [field, max] of Object.entries(STRING_LIMITS)) {
    const value = body[field];
    if (value == null || value === "") continue;
    if (typeof value !== "string") {
      errors.push({ field, message: "must be a string" });
    } else if (value.trim().length > max) {
      errors.push({ field, message: `must be at most ${max} characters` });
    } else {
      body[field] = value.trim();
    }
  }

  if (typeof body.title !== "string" || body.title.length === 0) {
    errors.push({ field: "title", message: "is required" });
  }

  if (body.categories != null) {
    if (
      !Array.isArray(body.categories) ||
      body.categories.length > 20 ||
      body.categories.some((value) => typeof value !== "string" || value.length > 100)
    ) {
      errors.push({ field: "categories", message: "must contain at most 20 category slugs" });
    }
  }

  if (body.location != null) {
    const location = body.location as { lat?: unknown; lng?: unknown };
    if (
      typeof location !== "object" ||
      typeof location.lat !== "number" ||
      !Number.isFinite(location.lat) ||
      location.lat < -90 ||
      location.lat > 90 ||
      typeof location.lng !== "number" ||
      !Number.isFinite(location.lng) ||
      location.lng < -180 ||
      location.lng > 180
    ) {
      errors.push({ field: "location", message: "must contain valid lat and lng coordinates" });
    }
  }

  for (const field of ["age_min", "age_max"] as const) {
    if (body[field] == null || body[field] === "") continue;
    const value = Number(body[field]);
    if (!Number.isInteger(value) || value < 0 || value > 120) {
      errors.push({ field, message: "must be an integer between 0 and 120" });
    } else {
      body[field] = value;
    }
  }
  if (
    typeof body.age_min === "number" &&
    typeof body.age_max === "number" &&
    body.age_min > body.age_max
  ) {
    errors.push({ field: "age_max", message: "must be greater than or equal to age_min" });
  }

  if (body.weekday != null && body.weekday !== "") {
    const weekday = Number(body.weekday);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      errors.push({ field: "weekday", message: "must be an integer between 0 and 6" });
    } else {
      body.weekday = weekday;
    }
  }

  for (const field of ["url", "image_url"] as const) {
    const value = body[field];
    if (value == null || value === "") continue;
    if (typeof value !== "string" || value.length > 2048) {
      errors.push({ field, message: "must be a valid HTTP or HTTPS URL" });
      continue;
    }
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
      body[field] = parsed.toString();
    } catch {
      errors.push({ field, message: "must be a valid HTTP or HTTPS URL" });
    }
  }

  if (kind === "event") {
    const start = dateValue(body.starts_at);
    const end = body.ends_at == null || body.ends_at === "" ? null : dateValue(body.ends_at);
    if (start == null) errors.push({ field: "starts_at", message: "must be a valid date" });
    if (body.ends_at != null && body.ends_at !== "" && end == null) {
      errors.push({ field: "ends_at", message: "must be a valid date" });
    } else if (start != null && end != null && end < start) {
      errors.push({ field: "ends_at", message: "must be greater than or equal to starts_at" });
    }
  }

  if (kind === "activity") {
    for (const field of ["start_time", "end_time"] as const) {
      const value = body[field];
      if (value != null && value !== "" && (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value))) {
        errors.push({ field, message: "must use HH:MM or HH:MM:SS" });
      }
    }
    if (body.ends_on != null && body.ends_on !== "" && dateValue(body.ends_on) == null) {
      errors.push({ field: "ends_on", message: "must be a valid date" });
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, body };
}