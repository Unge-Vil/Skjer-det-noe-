import { NextResponse } from "next/server";
import { authorizationServerUrl, mcpResourceUrl, MCP_SCOPES } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return NextResponse.json({ resource: mcpResourceUrl(request), authorization_servers: [authorizationServerUrl(request)], scopes_supported: MCP_SCOPES, resource_name: "Skjer det noe? MCP" });
}