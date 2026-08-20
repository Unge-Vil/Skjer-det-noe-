import { createClient } from "@/lib/supabase/server";

export const discoveryTools = [
  {
    name: "list_categories",
    title: "List kategorier",
    description: "Hent aktivitet- og arrangementskategoriene som er tilgjengelige i Skjer det noe?.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "list_municipalities",
    title: "List kommuner",
    description: "Søk i kommunekatalogen etter navn eller kommunenummer.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Valgfri del av kommunenavn eller kommunenummer." } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
] as const;

type ToolResult = { content: { type: "text"; text: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean };

export async function callDiscoveryTool(name: string, argumentsValue: unknown): Promise<ToolResult> {
  const argumentsObject = isRecord(argumentsValue) ? argumentsValue : {};
  const supabase = await createClient();

  if (name === "list_categories") {
    const { data, error } = await supabase.from("categories").select("slug,name,sort_order").order("sort_order");
    return queryResult(data, error?.message);
  }

  if (name === "list_municipalities") {
    const query = typeof argumentsObject.query === "string" ? argumentsObject.query.trim().slice(0, 80) : "";
    let request = supabase.from("municipalities").select("name,slug,kommunenummer,county").order("name").limit(50);
    if (query) request = request.or(`name.ilike.%${escapeFilter(query)}%,kommunenummer.ilike.%${escapeFilter(query)}%`);
    const { data, error } = await request;
    return queryResult(data, error?.message);
  }

  return { content: [{ type: "text", text: `Ukjent MCP-tool: ${name}` }], isError: true };
}

function queryResult(data: unknown, error?: string): ToolResult {
  if (error) return { content: [{ type: "text", text: "Kunne ikke hente data akkurat nå." }], structuredContent: { error: "Kunne ikke hente data akkurat nå." }, isError: true };
  const count = Array.isArray(data) ? data.length : 0;
  return { content: [{ type: "text", text: `Fant ${count} resultater.` }], structuredContent: { data } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeFilter(value: string): string {
  return value.replace(/[(),.%]/g, "");
}