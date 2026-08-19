import assert from "node:assert/strict";
import test from "node:test";
import { validateListingPayload } from "./validation.ts";

test("accepts a valid event payload", () => {
  const result = validateListingPayload("event", {
    title: "Konsert",
    starts_at: "2026-08-20T18:00:00Z",
    ends_at: "2026-08-20T20:00:00Z",
    location: { lat: 59.4, lng: 5.3 },
    age_min: 13,
    age_max: 18,
    url: "https://example.com/event",
  });
  assert.equal(result.ok, true);
});

test("rejects malformed bodies and out-of-range fields", () => {
  assert.equal(validateListingPayload("activity", []).ok, false);
  const result = validateListingPayload("activity", {
    title: "x".repeat(256),
    location: { lat: 91, lng: 181 },
    age_min: 121,
    weekday: 7,
    image_url: "file:///private",
  });
  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map(({ field }) => field),
    ["title", "location", "age_min", "weekday", "image_url"],
  );
});

test("rejects event end dates before their start date", () => {
  const result = validateListingPayload("event", {
    title: "Konsert",
    starts_at: "2026-08-20T20:00:00Z",
    ends_at: "2026-08-20T18:00:00Z",
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].field, "ends_at");
});

test("rejects age ranges in reverse order", () => {
  const result = validateListingPayload("activity", {
    title: "Aktivitet",
    age_min: 18,
    age_max: 13,
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].field, "age_max");
});

test("validates and normalizes an activity payload", () => {
  const valid = validateListingPayload("activity", {
    title: "  Fotball  ",
    weekday: "2",
    start_time: "18:30",
    end_time: "20:00:00",
    ends_on: "2026-12-31",
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.body.title, "Fotball");
  assert.equal(valid.body.weekday, 2);

  const invalid = validateListingPayload("activity", {
    title: "Fotball",
    start_time: "25:00",
    end_time: "9:3",
    ends_on: "not-a-date",
  });
  assert.equal(invalid.ok, false);
  assert.deepEqual(invalid.errors.map(({ field }) => field), ["start_time", "end_time", "ends_on"]);
});