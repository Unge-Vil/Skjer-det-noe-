import { bearerToken } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { mcpResourceUrl, secretHash } from "@/lib/mcp/oauth";

export interface McpScope {
  userId: string;
  organizationIds: string[];
  municipalityIds: string[];
  isPlatformAdmin: boolean;
  scopes: string[];
}

/**
 * Verify the caller's Supabase access token, then derive all authority from
 * membership tables. MCP clients never supply an authoritative org/muni ID.
 */
export async function resolveMcpScope(request: Request): Promise<McpScope | null> {
  const token = bearerToken(request);
  if (!token) return null;

  const admin = createAdminClient();
  if (token.startsWith("sdn_mcp_at_")) {
    const { data: accessToken } = await admin
      .from("mcp_oauth_tokens")
      .select("user_id,scopes,resource,expires_at,revoked_at")
      .eq("token_hash", await secretHash(token))
      .eq("token_type", "access")
      .maybeSingle();
    if (!accessToken || accessToken.revoked_at || accessToken.resource !== mcpResourceUrl(request) || new Date(accessToken.expires_at as string) <= new Date()) return null;
    await admin.from("mcp_oauth_tokens").update({ last_used_at: new Date().toISOString() }).eq("token_hash", await secretHash(token));
    return resolveUserScope(accessToken.user_id as string, accessToken.scopes as string[]);
  }

  // Direct Supabase tokens remain available only in development to make local
  // MCP testing possible. Production accepts only audience-bound OAuth tokens.
  if (process.env.NODE_ENV === "production") return null;
  const { data: userResult, error: userError } = await admin.auth.getUser(token);
  const user = userResult.user;
  if (userError || !user) return null;
  return resolveUserScope(user.id, ["mcp:read", "mcp:write"]);
}

async function resolveUserScope(userId: string, scopes: string[]): Promise<McpScope> {
  const admin = createAdminClient();
  const [orgMembers, profileMembers, municipalityAdmins, profile] = await Promise.all([
    admin.from("organization_members").select("organization_id").eq("user_id", userId),
    admin.from("org_profile_members").select("org_profiles(organization_id)").eq("user_id", userId),
    admin.from("municipality_admins").select("municipality_id").eq("user_id", userId),
    admin.from("profiles").select("is_platform_admin").eq("id", userId).maybeSingle(),
  ]);

  const organizationIds = new Set<string>();
  for (const row of orgMembers.data ?? []) organizationIds.add(row.organization_id as string);
  for (const row of profileMembers.data ?? []) {
    const profiles = (row as { org_profiles: { organization_id: string }[] }).org_profiles;
    for (const profileRow of profiles ?? []) {
      if (profileRow.organization_id) organizationIds.add(profileRow.organization_id);
    }
  }

  return {
    userId,
    organizationIds: [...organizationIds],
    municipalityIds: (municipalityAdmins.data ?? []).map((row) => row.municipality_id as string),
    isPlatformAdmin: Boolean(profile.data?.is_platform_admin),
    scopes,
  };
}

export function canUseOrganization(scope: McpScope, organizationId: string): boolean {
  return scope.isPlatformAdmin || scope.organizationIds.includes(organizationId);
}

export function canUseMunicipality(scope: McpScope, municipalityId: string): boolean {
  return scope.isPlatformAdmin || scope.municipalityIds.includes(municipalityId);
}

export function hasMcpScope(scope: McpScope, scopeName: "mcp:read" | "mcp:write"): boolean {
  return scope.scopes.includes(scopeName);
}