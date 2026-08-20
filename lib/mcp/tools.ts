import { upsertListingFromApi, type ListingKind } from "@/lib/api/listings";
import { createAdminClient } from "@/lib/supabase/admin";
import { canUseMunicipality, canUseOrganization, hasMcpScope, type McpScope } from "@/lib/mcp/auth";

type JsonObject = Record<string, unknown>;
export type ToolResult = { content: { type: "text"; text: string }[]; structuredContent?: JsonObject; isError?: boolean };

const identifier = { type: "string", format: "uuid" };
const limit = { type: "integer", minimum: 1, maximum: 100, default: 50 };
const tool = (name: string, description: string, properties: JsonObject, required: string[], readOnlyHint = true) => ({
  name,
  title: name.replaceAll("_", " "),
  description,
  inputSchema: { type: "object", properties, required, additionalProperties: false },
  annotations: { readOnlyHint, destructiveHint: false, openWorldHint: false },
});

export const authenticatedTools = [
  tool("list_organisation_profiles", "List profiler i en organisasjon du administrerer.", { organization_id: identifier }, ["organization_id"]),
  tool("list_events", "List arrangementer i en organisasjon du administrerer.", { organization_id: identifier, limit }, ["organization_id"]),
  tool("get_event", "Hent ett arrangement i en organisasjon du administrerer.", { organization_id: identifier, event_id: identifier }, ["organization_id", "event_id"]),
  tool("list_activities", "List faste aktiviteter i en organisasjon du administrerer.", { organization_id: identifier, limit }, ["organization_id"]),
  tool("get_activity", "Hent én aktivitet i en organisasjon du administrerer.", { organization_id: identifier, activity_id: identifier }, ["organization_id", "activity_id"]),
  tool("create_or_update_event", "Opprett eller oppdater et arrangementsutkast i en organisasjon du administrerer. Oppdateringer bruker external_ref.", { organization_id: identifier, listing: { type: "object", description: "Samme felt som Organisasjons-API EventInput." } }, ["organization_id", "listing"], false),
  tool("create_or_update_activity", "Opprett eller oppdater et aktivitetsutkast i en organisasjon du administrerer. Oppdateringer bruker external_ref.", { organization_id: identifier, listing: { type: "object", description: "Samme felt som Organisasjons-API ActivityInput." } }, ["organization_id", "listing"], false),
  tool("list_municipality_activities", "List publiserte aktiviteter i en kommune du administrerer.", { municipality_id: identifier, limit }, ["municipality_id"]),
  tool("list_municipality_events", "List publiserte arrangementer i en kommune du administrerer.", { municipality_id: identifier, limit }, ["municipality_id"]),
  tool("list_municipality_organisations", "List organisasjoner knyttet til en kommune du administrerer.", { municipality_id: identifier, limit }, ["municipality_id"]),
  tool("list_municipality_pages", "List kommunens egne infosider, inkludert utkast.", { municipality_id: identifier }, ["municipality_id"]),
  tool("create_municipality_page", "Opprett en infoside som utkast for en kommune du administrerer.", { municipality_id: identifier, title: { type: "string" }, slug: { type: "string" }, content: { type: "object" }, title_en: { type: "string" }, content_en: { type: "object" }, sort_order: { type: "integer" } }, ["municipality_id", "title", "content"], false),
  tool("update_municipality_page", "Oppdater en infoside i en kommune du administrerer.", { municipality_id: identifier, page_id: identifier, title: { type: "string" }, slug: { type: "string" }, content: { type: "object" }, title_en: { type: "string" }, content_en: { type: "object" }, sort_order: { type: "integer" } }, ["municipality_id", "page_id", "title", "content"], false),
  tool("publish_municipality_page", "Publiser en infoside i en kommune du administrerer.", { municipality_id: identifier, page_id: identifier }, ["municipality_id", "page_id"], false),
] as const;

export async function callAuthenticatedTool(name: string, input: unknown, scope: McpScope | null): Promise<ToolResult> {
  if (!scope) return failure("Du må være logget inn for å bruke dette verktøyet.");
  const args = isObject(input) ? input : null;
  if (!args) return failure("Tool-input må være et objekt.");
  const isWrite = name.startsWith("create_") || name.startsWith("update_") || name.startsWith("publish_");
  if (!hasMcpScope(scope, isWrite ? "mcp:write" : "mcp:read")) return failure("Tokenet mangler nødvendig tilgang.");

  if (name.startsWith("list_municipality_") || name.endsWith("municipality_page")) {
    const municipalityId = stringArg(args, "municipality_id");
    if (!municipalityId) return failure("municipality_id mangler.");
    if (!canUseMunicipality(scope, municipalityId)) return failure("Du har ikke tilgang til denne kommunen.");
    return callMunicipalityTool(name, args, municipalityId);
  }

  const organizationId = stringArg(args, "organization_id");
  if (!organizationId) return failure("organization_id mangler.");
  if (!canUseOrganization(scope, organizationId)) return failure("Du har ikke tilgang til denne organisasjonen.");
  return callOrganizationTool(name, args, organizationId);
}

async function callOrganizationTool(name: string, args: JsonObject, organizationId: string): Promise<ToolResult> {
  const admin = createAdminClient();
  if (name === "list_organisation_profiles") {
    const { data, error } = await admin.from("org_profiles").select("id,name,slug,municipality_id,created_at,updated_at").eq("organization_id", organizationId).order("name");
    return databaseResult(data, error?.message);
  }

  const listingKind: ListingKind | null = name.includes("event") ? "event" : name.includes("activity") ? "activity" : null;
  if (!listingKind) return failure(`Ukjent MCP-tool: ${name}`);
  const table = listingKind === "event" ? "events" : "activities";

  if (name.startsWith("create_or_update_")) {
    const listing = isObject(args.listing) ? args.listing : null;
    if (!listing) return failure("listing mangler eller er ugyldig.");
    const result = await upsertListingFromApi(admin, organizationId, false, listingKind, listing, "mcp");
    return result.status < 400 ? success(result.body) : failure(result.body.message ?? "Kunne ikke lagre oppføringen.", result.body);
  }

  const id = stringArg(args, listingKind === "event" ? "event_id" : "activity_id");
  if (id) {
    const { data, error } = await admin.from(table).select("*").eq("id", id).eq("organization_id", organizationId).maybeSingle();
    if (error) return failure("Kunne ikke hente oppføringen.");
    return data ? success({ data }) : failure("Oppføringen ble ikke funnet.");
  }

  const { data, error } = await admin
    .from(table)
    .select("id,slug,title,description,status,source,external_ref,municipality_id,profile_id,created_at,updated_at")
    .eq("organization_id", organizationId)
    .order(listingKind === "event" ? "starts_at" : "created_at", { ascending: false })
    .limit(readLimit(args));
  return databaseResult(data, error?.message);
}

async function callMunicipalityTool(name: string, args: JsonObject, municipalityId: string): Promise<ToolResult> {
  const admin = createAdminClient();
  if (name === "list_municipality_activities" || name === "list_municipality_events") {
    const table = name.endsWith("events") ? "events" : "activities";
    const { data, error } = await admin
      .from(table)
      .select("id,slug,title,description,status,organization_id,profile_id,created_at,updated_at")
      .eq("municipality_id", municipalityId)
      .eq("status", "published")
      .order(table === "events" ? "starts_at" : "created_at", { ascending: false })
      .limit(readLimit(args));
    return databaseResult(data, error?.message);
  }

  if (name === "list_municipality_organisations") {
    const { data, error } = await admin
      .from("organization_municipalities")
      .select("organizations(id,name,slug,status,description,website,email,phone,org_number,is_volunteer)")
      .eq("municipality_id", municipalityId)
      .limit(readLimit(args));
    return databaseResult((data ?? []).map((row) => (row as { organizations: unknown }).organizations).filter(Boolean), error?.message);
  }

  if (name === "list_municipality_pages") {
    const { data, error } = await admin.from("municipality_pages").select("id,title,title_en,slug,status,sort_order,updated_at").eq("municipality_id", municipalityId).order("sort_order").order("title");
    return databaseResult(data, error?.message);
  }

  if (name === "publish_municipality_page") {
    const pageId = stringArg(args, "page_id");
    if (!pageId) return failure("page_id mangler.");
    const { data, error } = await admin.from("municipality_pages").update({ status: "published" }).eq("id", pageId).eq("municipality_id", municipalityId).select("id,slug,title,status").maybeSingle();
    if (error) return failure("Kunne ikke publisere siden.");
    return data ? success({ data }) : failure("Siden ble ikke funnet.");
  }

  const page = pageInput(args);
  if (!page) return failure("title og content må være gyldige verdier.");
  if (name === "create_municipality_page") {
    const { data, error } = await admin.from("municipality_pages").insert({ ...page, municipality_id: municipalityId, status: "draft" }).select("id,slug,title,status").single();
    return error ? failure("Kunne ikke opprette siden.") : success({ data });
  }
  if (name === "update_municipality_page") {
    const pageId = stringArg(args, "page_id");
    if (!pageId) return failure("page_id mangler.");
    const { data, error } = await admin.from("municipality_pages").update(page).eq("id", pageId).eq("municipality_id", municipalityId).select("id,slug,title,status").maybeSingle();
    if (error) return failure("Kunne ikke oppdatere siden.");
    return data ? success({ data }) : failure("Siden ble ikke funnet.");
  }

  return failure(`Ukjent MCP-tool: ${name}`);
}

function pageInput(args: JsonObject): JsonObject | null {
  const title = stringArg(args, "title");
  const content = args.content;
  if (!title || title.length > 255 || !isObject(content)) return null;
  const slugInput = stringArg(args, "slug");
  const titleEn = stringArg(args, "title_en");
  return {
    title,
    slug: pageSlug(slugInput || title),
    content,
    title_en: titleEn ?? null,
    content_en: isObject(args.content_en) ? args.content_en : null,
    sort_order: Number.isInteger(args.sort_order) ? args.sort_order : 0,
  };
}

function readLimit(args: JsonObject): number {
  const value = typeof args.limit === "number" ? args.limit : 50;
  return Math.min(Math.max(Math.trunc(value), 1), 100);
}

function stringArg(args: JsonObject, field: string): string | null {
  const value = args[field];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function success(data: unknown): ToolResult {
  const structuredContent = isObject(data) ? data : { data };
  return { content: [{ type: "text", text: summary(data) }], structuredContent };
}

function failure(message: string, details?: unknown): ToolResult {
  return { content: [{ type: "text", text: message }], structuredContent: { error: message, details }, isError: true };
}

function databaseResult(data: unknown, error?: string): ToolResult {
  return error ? failure("Kunne ikke hente data akkurat nå.") : success({ data });
}

function summary(data: unknown): string {
  if (!isObject(data)) return "Ferdig.";
  const rows = Array.isArray(data.data) ? data.data : null;
  if (rows) return `Fant ${rows.length} resultater.`;
  if (typeof data.title === "string") return `Lagret «${data.title}».${typeof data.status === "string" ? ` Status: ${data.status}.` : ""}`;
  if (isObject(data.data) && typeof data.data.title === "string") return `Lagret «${data.data.title}».${typeof data.data.status === "string" ? ` Status: ${data.data.status}.` : ""}`;
  return "Ferdig.";
}

function pageSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[æå]/g, "a")
    .replace(/ø/g, "o")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "side";
}