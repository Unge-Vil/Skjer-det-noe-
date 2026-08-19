(function exposeCachePolicy(scope) {
  const PUBLIC_EXACT = new Set([
    "/",
    "/api-dokumentasjon",
    "/for-kommuner",
    "/for-organisasjoner",
    "/frivilligtorg",
    "/kart",
    "/lagret",
    "/offline",
    "/om",
    "/organisasjoner",
    "/personvern",
    "/tjenester",
    "/tilgjengelighet",
    "/utforsk",
    "/vilkar",
  ]);
  const PUBLIC_PREFIXES = [
    "/aktivitet/",
    "/arrangement/",
    "/frivillig/",
    "/organisasjon/",
    "/tjeneste/",
  ];
  const MUNICIPALITY_ADMIN_SEGMENTS = new Set([
    "aktiviteter",
    "frivilligtorg",
    "innhold",
    "organisasjoner",
    "profil",
    "sider",
    "tjenester",
  ]);

  function isPublicNavigation(pathname) {
    const normalized = pathname !== "/" ? pathname.replace(/\/$/, "") : pathname;
    if (PUBLIC_EXACT.has(normalized)) return true;
    if (PUBLIC_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return true;

    const municipalityMatch = normalized.match(/^\/kommune\/([^/]+)(?:\/.*)?$/);
    return Boolean(
      municipalityMatch && !MUNICIPALITY_ADMIN_SEGMENTS.has(municipalityMatch[1]),
    );
  }

  function isCacheableResponse(response) {
    const cacheControl = response.headers.get("cache-control") || "";
    return (
      response.ok &&
      response.status === 200 &&
      !/(?:^|,)\s*(?:private|no-store)(?:\s|,|$)/i.test(cacheControl)
    );
  }

  scope.SW_CACHE_POLICY = { isCacheableResponse, isPublicNavigation };
})(typeof self === "undefined" ? globalThis : self);