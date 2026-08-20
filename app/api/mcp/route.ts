import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/server";
import { callDiscoveryTool, discoveryTools } from "@/lib/mcp/discovery";
import { resolveMcpScope } from "@/lib/mcp/auth";
import { authenticatedTools, callAuthenticatedTool } from "@/lib/mcp/tools";
import { mcpResourceUrl } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

const JSON_RPC_VERSION = "2.0";

type JsonRpcRequest = {
  jsonrpc?: unknown;
  id?: string | number | null;
  method?: unknown;
  params?: unknown;
};

/**
 * Stateless MCP endpoint. The initial release only exposes public discovery
 * tools; account-scoped tools are added once delegated OAuth is in place.
 */
export async function POST(request: Request) {
  let message: JsonRpcRequest;
  try {
    message = await request.json();
  } catch {
    return rpcError(null, -32700, "Ugyldig JSON.");
  }

  if (!message || message.jsonrpc !== JSON_RPC_VERSION || typeof message.method !== "string") {
    return rpcError(message?.id ?? null, -32600, "Ugyldig JSON-RPC-forespørsel.");
  }

  const scope = await resolveMcpScope(request);
  if (!scope) return oauthChallenge(request);

  if (message.method === "notifications/initialized") return new Response(null, { status: 202 });
  if (message.method === "initialize") {
    return rpcResult(message.id ?? null, {
      protocolVersion: LATEST_PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "skjer-det-noe", version: "0.1.0" },
      instructions: "Bruk discovery-tools for offentlig katalogdata. Kontoavgrensede organisasjons- og kommuneverktøy krever OAuth og blir lagt til fortløpende.",
    });
  }

  if (message.method === "tools/list") {
    return rpcResult(message.id ?? null, { tools: [...discoveryTools, ...authenticatedTools] });
  }
  if (message.method === "tools/call") {
    const params = isRecord(message.params) ? message.params : null;
    if (!params || typeof params.name !== "string") return rpcError(message.id ?? null, -32602, "Mangler tool-navn.");
    if (discoveryTools.some((tool) => tool.name === params.name)) {
      return rpcResult(message.id ?? null, await callDiscoveryTool(params.name, params.arguments));
    }
    return rpcResult(message.id ?? null, await callAuthenticatedTool(params.name, params.arguments, scope));
  }

  return rpcError(message.id ?? null, -32601, `Ukjent MCP-metode: ${message.method}`);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { Allow: "POST, OPTIONS" } });
}

function rpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return Response.json({ jsonrpc: JSON_RPC_VERSION, id, result });
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string) {
  return Response.json({ jsonrpc: JSON_RPC_VERSION, id, error: { code, message } });
}

function oauthChallenge(request: Request) {
  const resourceMetadata = `${new URL(mcpResourceUrl(request)).origin}/.well-known/oauth-protected-resource/mcp`;
  return Response.json({ error: "unauthorized" }, { status: 401, headers: { "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadata}", scope="mcp:read mcp:write"` } });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}