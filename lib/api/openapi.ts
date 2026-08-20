export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Skjer det noe? API",
    version: "1.0.0",
    description: "Tre adskilte API-er: Organisasjons-API for å publisere egne oppføringer, Kommune-API for å hente kommunens publiserte innhold, og en offentlig feed for publiserte oppføringer.",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "Organisasjons-API", description: "Opprett, oppdater og hent organisasjonens egne aktiviteter og arrangementer." },
    { name: "Kommune-API", description: "Hent publiserte aktiviteter og arrangementer innenfor kommunen som API-nøkkelen tilhører." },
    { name: "Offentlig feed", description: "Les publiserte oppføringer med canonical URL-er for distribusjon og attribusjon." },
  ],
  paths: {
    "/api/v1/activities": {
      post: {
        tags: ["Organisasjons-API"],
        summary: "Opprett eller oppdater aktivitet",
        operationId: "upsertActivity",
        security: [{ organizationBearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ActivityInput" } } } },
        responses: { "200": response("Aktivitet lagret"), "400": response("Ugyldig forespørsel"), "401": response("Ugyldig API-nøkkel"), "429": rateLimitedResponse() },
      },
      get: {
        tags: ["Organisasjons-API"],
        summary: "List organisasjonens aktiviteter",
        operationId: "listActivities",
        security: [{ organizationBearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/Limit" }],
        responses: { "200": response("Aktiviteter"), "401": response("Ugyldig API-nøkkel"), "429": rateLimitedResponse() },
      },
    },
    "/api/v1/events": {
      post: {
        tags: ["Organisasjons-API"],
        summary: "Opprett eller oppdater arrangement",
        operationId: "upsertEvent",
        security: [{ organizationBearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/EventInput" } } } },
        responses: { "200": response("Arrangement lagret"), "400": response("Ugyldig forespørsel"), "401": response("Ugyldig API-nøkkel"), "429": rateLimitedResponse() },
      },
      get: {
        tags: ["Organisasjons-API"],
        summary: "List organisasjonens arrangementer",
        operationId: "listEvents",
        security: [{ organizationBearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/Limit" }],
        responses: { "200": response("Arrangementer"), "401": response("Ugyldig API-nøkkel"), "429": rateLimitedResponse() },
      },
    },
    "/api/v1/municipality/listings": {
      get: {
        tags: ["Kommune-API"],
        summary: "List kommunens publiserte aktiviteter eller arrangementer",
        operationId: "listMunicipalityListings",
        security: [{ municipalityBearerAuth: [] }],
        parameters: [
          { name: "kind", in: "query", description: "Type oppføring. Standard er aktiviteter.", required: false, schema: { type: "string", enum: ["activities", "events"], default: "activities" } },
          { $ref: "#/components/parameters/Limit" },
        ],
        responses: { "200": response("Kommunens publiserte oppføringer"), "401": response("Ugyldig kommune-API-nøkkel"), "429": rateLimitedResponse() },
      },
    },
    "/api/public/v1/listings": {
      get: {
        tags: ["Offentlig feed"],
        summary: "List publiserte offentlige oppføringer",
        operationId: "listPublicListings",
        parameters: [
          { name: "kind", in: "query", description: "Type oppføring.", required: false, schema: { type: "string", enum: ["activity", "event", "service", "volunteer"], default: "activity" } },
          { name: "municipality", in: "query", description: "Kommunenummer, for eksempel 1103.", required: false, schema: { type: "string", pattern: "^[0-9]{4}$" } },
          { name: "offset", in: "query", description: "Startposisjon for neste side.", required: false, schema: { type: "integer", default: 0, minimum: 0 } },
          { $ref: "#/components/parameters/Limit" },
        ],
        responses: { "200": response("Publiserte oppføringer med canonical URL og oppdateringstid"), "400": response("Ugyldig filter"), "429": rateLimitedResponse() },
      },
    },
  },
  components: {
    securitySchemes: {
      organizationBearerAuth: { type: "http", scheme: "bearer", bearerFormat: "sdn_live_...", description: "Organisasjonsnøkkel. Har bare tilgang til organisasjonen nøkkelen tilhører." },
      municipalityBearerAuth: { type: "http", scheme: "bearer", bearerFormat: "sdn_muni_...", description: "Kommune-API-nøkkel. Leser bare publisert innhold i kommunen nøkkelen tilhører." },
    },
    parameters: { Limit: { name: "limit", in: "query", description: "Maksimalt antall oppføringer", required: false, schema: { type: "integer", default: 50, minimum: 1, maximum: 100 } } },
    schemas: {
      ActivityInput: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", description: "Aktivitetens tittel" },
          description: { type: "string" },
          category: { type: "string", example: "sports" },
          municipality: { type: "string", description: "Kommunenummer, for eksempel 1103" },
          weekday: { type: "integer", minimum: 0, maximum: 6 },
          start_time: { type: "string", example: "17:00" },
          end_time: { type: "string", example: "19:00" },
          external_ref: { type: "string", description: "Stabil ID fra kildesystemet" },
        },
      },
      EventInput: {
        type: "object",
        required: ["title", "starts_at"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          starts_at: { type: "string", format: "date-time", example: "2026-09-01T17:00:00+02:00" },
          ends_at: { type: "string", format: "date-time" },
          category: { type: "string", example: "sports" },
          municipality: { type: "string", description: "Kommunenummer, for eksempel 1103" },
          external_ref: { type: "string", description: "Stabil ID fra kildesystemet" },
        },
      },
    },
  },
} as const;

function response(description: string) {
  return { description, content: { "application/json": { schema: { type: "object", additionalProperties: true } } } };
}

function rateLimitedResponse() {
  return {
    description: "For mange forespørsler.",
    headers: {
      "Retry-After": {
        description: "Sekunder til nytt forsøk.",
        schema: { type: "string" },
      },
    },
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            error: { type: "string", example: "rate_limited" },
            message: { type: "string", example: "For mange foresporsler. Prov igjen senere." },
            retryAfter: { type: "integer", example: 60 },
          },
          required: ["error", "message", "retryAfter"],
        },
      },
    },
  };
}
