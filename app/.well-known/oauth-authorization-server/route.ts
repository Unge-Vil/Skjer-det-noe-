import { NextResponse } from "next/server";
import { authorizationServerUrl, MCP_SCOPES } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const issuer = authorizationServerUrl(request);
  return NextResponse.json({
    issuer,
    authorization_endpoint: `${issuer}/api/oauth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    registration_endpoint: `${issuer}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: MCP_SCOPES,
  });
}