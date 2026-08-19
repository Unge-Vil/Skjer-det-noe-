export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Skjer det noe? API",
    version: "1.0.0",
    description: "Publiser og hent organisasjonens aktiviteter og arrangementer.",
  },
  servers: [{ url: "/" }],
  security: [{ bearerAuth: [] }],
  paths: {
    "/api/v1/activities": {
      post: {
        summary: "Opprett eller oppdater aktivitet",
        operationId: "upsertActivity",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ActivityInput" } } } },
        responses: { "200": response("Aktivitet lagret"), "400": response("Ugyldig forespørsel"), "401": response("Ugyldig API-nøkkel") },
      },
      get: {
        summary: "List organisasjonens aktiviteter",
        operationId: "listActivities",
        parameters: [{ $ref: "#/components/parameters/Limit" }],
        responses: { "200": response("Aktiviteter"), "401": response("Ugyldig API-nøkkel") },
      },
    },
    "/api/v1/events": {
      post: {
        summary: "Opprett eller oppdater arrangement",
        operationId: "upsertEvent",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/EventInput" } } } },
        responses: { "200": response("Arrangement lagret"), "400": response("Ugyldig forespørsel"), "401": response("Ugyldig API-nøkkel") },
      },
      get: {
        summary: "List organisasjonens arrangementer",
        operationId: "listEvents",
        parameters: [{ $ref: "#/components/parameters/Limit" }],
        responses: { "200": response("Arrangementer"), "401": response("Ugyldig API-nøkkel") },
      },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "sdn_live_..." } },
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
