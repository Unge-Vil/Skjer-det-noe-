import { createAdminClient } from "@/lib/supabase/admin";
import { hashKey, isKeyShape } from "@/lib/apiKeys";

export interface ResolvedKey {
  id: string;
  organizationId: string;
  autoPublish: boolean;
}

export interface ResolvedMunicipalityKey {
  id: string;
  municipalityId: string;
}

/** Extract a bearer token from an `Authorization: Bearer …` header. */
export function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/**
 * Resolve a raw API token to its organisation. Returns null for missing,
 * malformed, unknown or revoked keys. Bumps `last_used_at` best-effort.
 * Uses the service-role client, so it must only be called from server routes.
 */
export async function resolveApiKey(token: string | null): Promise<ResolvedKey | null> {
  if (!token || !isKeyShape(token, "organization")) return null;
  const admin = createAdminClient();
  const hash = await hashKey(token);
  const { data } = await admin
    .from("api_keys")
    .select("id,organization_id,auto_publish,revoked_at")
    .eq("key_hash", hash)
    .maybeSingle();
  if (!data || data.revoked_at) return null;
  await admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return {
    id: data.id as string,
    organizationId: data.organization_id as string,
    autoPublish: data.auto_publish as boolean,
  };
}

/** Resolve a municipality-scoped key. Organisation keys can never authenticate
 * this API, even if their hash appears in a different key table. */
export async function resolveMunicipalityApiKey(token: string | null): Promise<ResolvedMunicipalityKey | null> {
  if (!token || !isKeyShape(token, "municipality")) return null;
  const admin = createAdminClient();
  const hash = await hashKey(token);
  const { data } = await admin
    .from("municipality_api_keys")
    .select("id,municipality_id,revoked_at")
    .eq("key_hash", hash)
    .maybeSingle();
  if (!data || data.revoked_at) return null;
  await admin.from("municipality_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return { id: data.id as string, municipalityId: data.municipality_id as string };
}
