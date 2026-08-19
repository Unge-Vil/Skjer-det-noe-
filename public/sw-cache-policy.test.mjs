import assert from "node:assert/strict";
import test from "node:test";
import "./sw-cache-policy.js";

const { isCacheableResponse, isPublicNavigation } = globalThis.SW_CACHE_POLICY;

test("allows only explicit public navigation routes", () => {
  for (const path of [
    "/",
    "/utforsk",
    "/aktivitet/fotball",
    "/lagret",
    "/organisasjon/unge-vil",
    "/kommune/karmoy",
    "/kommune/karmoy/om-oss",
  ]) {
    assert.equal(isPublicNavigation(path), true, path);
  }
});

test("blocks authenticated, account and API-like navigation routes", () => {
  for (const path of [
    "/admin",
    "/admin/innstillinger",
    "/plattform",
    "/kommune",
    "/kommune/profil",
    "/kommune/innhold",
    "/konto",
    "/logg-inn",
    "/registrer",
    "/api/v1/events",
  ]) {
    assert.equal(isPublicNavigation(path), false, path);
  }
});

test("caches only successful responses without private cache directives", () => {
  assert.equal(isCacheableResponse(new Response("ok", { status: 200 })), true);
  assert.equal(isCacheableResponse(new Response("redirect", { status: 301 })), false);
  assert.equal(isCacheableResponse(new Response("error", { status: 500 })), false);
  assert.equal(
    isCacheableResponse(new Response("private", { headers: { "cache-control": "private" } })),
    false,
  );
  assert.equal(
    isCacheableResponse(new Response("fresh", { headers: { "cache-control": "no-store" } })),
    false,
  );
});