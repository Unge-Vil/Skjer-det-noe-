import { createAdminClient } from "@/lib/supabase/admin";
import { hashKey, isKeyShape } from "@/lib/apiKeys";

export interface ResolvedKey {
  id: string;
  organizationId: string;
  autoPublish: boolean;
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
  if (!token || !isKeyShape(token)) return null;
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
