import { createAdminClient } from "@/lib/supabase/admin";
import { MCP_SCOPES, isSafeRedirectUri, mcpResourceUrl } from "@/lib/mcp/oauth";

export type AuthorizationRequest = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  state: string | null;
  resource: string;
  clientName: string;
};

export async function parseAuthorizationRequest(params: URLSearchParams, request: Request): Promise<AuthorizationRequest | { error: string }> {
  const clientId = params.get("client_id")?.trim() ?? "";
  const redirectUri = params.get("redirect_uri")?.trim() ?? "";
  const codeChallenge = params.get("code_challenge")?.trim() ?? "";
  const resource = params.get("resource")?.trim() ?? "";
  if (params.get("response_type") !== "code") return { error: "response_type må være code." };
  if (!clientId || !redirectUri || !codeChallenge || params.get("code_challenge_method") !== "S256") return { error: "Mangler gyldige OAuth-parametere." };
  if (!isSafeRedirectUri(redirectUri)) return { error: "Ugyldig redirect_uri." };
  if (resource !== mcpResourceUrl(request)) return { error: "resource må være MCP-serverens adresse." };

  const scopes = (params.get("scope") ?? "mcp:read").split(/\s+/).filter(Boolean);
  if (!scopes.length || scopes.some((scope) => !MCP_SCOPES.includes(scope as (typeof MCP_SCOPES)[number]))) return { error: "Ugyldig OAuth-scope." };

  const admin = createAdminClient();
  const { data: client } = await admin.from("mcp_oauth_clients").select("client_name,redirect_uris").eq("client_id", clientId).maybeSingle();
  const redirectUris = Array.isArray(client?.redirect_uris) ? client.redirect_uris : [];
  if (!client || !redirectUris.includes(redirectUri)) return { error: "OAuth-klienten eller redirect_uri er ikke registrert." };
  return { clientId, redirectUri, codeChallenge, scopes, state: params.get("state"), resource, clientName: client.client_name as string };
}

export function addAuthorizationResponse(redirectUri: string, values: Record<string, string | null>): string {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(values)) if (value) url.searchParams.set(key, value);
  return url.toString();
}