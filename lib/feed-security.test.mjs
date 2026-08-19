import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchCalendarFeed,
  resolvePublicHostname,
  validateFeedUrl,
} from "./feed-security.ts";

test("rejects local, private, credentialed and non-HTTPS feed URLs", () => {
  const blocked = [
    "http://example.com/feed.ics",
    "https://localhost/feed.ics",
    "https://calendar.internal/feed.ics",
    "https://10.0.0.1/feed.ics",
    "https://169.254.169.254/feed.ics",
    "https://[::1]/feed.ics",
    "https://[0:0:0:0:0:0:0:1]/feed.ics",
    "https://[::ffff:127.0.0.1]/feed.ics",
    "https://user:password@example.com/feed.ics",
  ];
  for (const url of blocked) {
    assert.throws(() => validateFeedUrl(url), /feed_url_not_allowed/);
  }
  assert.equal(validateFeedUrl("https://example.com/feed.ics").hostname, "example.com");
});

test("validates a redirect target before fetching it", async () => {
  let fetches = 0;
  const fetchImpl = async () => {
    fetches += 1;
    return new Response(null, {
      status: 302,
      headers: { location: "https://127.0.0.1/private.ics" },
    });
  };

  await assert.rejects(
    fetchCalendarFeed("https://example.com/feed.ics", {
      fetchImpl,
      resolveHostname: async () => {},
    }),
    /feed_url_not_allowed/,
  );
  assert.equal(fetches, 1);
});

test("rejects a public-looking hostname that resolves to a private address", async () => {
  const dnsFetch = async (input) => {
    const type = new URL(input.toString()).searchParams.get("type");
    return Response.json({
      Answer: type === "A" ? [{ type: 1, data: "10.0.0.1" }] : [],
    });
  };

  await assert.rejects(
    resolvePublicHostname(
      "calendar.example.com",
      dnsFetch,
      new AbortController().signal,
    ),
    /feed_url_not_allowed/,
  );
});

test("stops reading a feed beyond the configured byte limit", async () => {
  await assert.rejects(
    fetchCalendarFeed("https://example.com/feed.ics", {
      fetchImpl: async () => new Response("123456", { status: 200 }),
      resolveHostname: async () => {},
      maxBytes: 5,
    }),
    /feed_too_large/,
  );
});

test("aborts a hanging feed request", async () => {
  const fetchImpl = (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    });

  await assert.rejects(
    fetchCalendarFeed("https://example.com/feed.ics", {
      fetchImpl,
      resolveHostname: async () => {},
      timeoutMs: 1,
    }),
    /feed_timeout/,
  );
});

test("returns a valid public HTTPS calendar body", async () => {
  const body = await fetchCalendarFeed("https://example.com/feed.ics", {
    fetchImpl: async () => new Response("BEGIN:VCALENDAR", { status: 200 }),
    resolveHostname: async () => {},
  });
  assert.equal(body, "BEGIN:VCALENDAR");
});

test("rejects compressed feed bodies before parsing", async () => {
  await assert.rejects(
    fetchCalendarFeed("https://example.com/feed.ics", {
      fetchImpl: async () => new Response("compressed", {
        status: 200,
        headers: { "content-encoding": "gzip" },
      }),
      resolveHostname: async () => {},
    }),
    /feed_compression_not_allowed/,
  );
});