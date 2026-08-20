// Isomorphic API-key helpers (Web Crypto — run in both the browser, when an org
// admin mints a key, and on the server, when a request is authenticated).
// The raw token is shown to the user once; only its sha-256 hash is stored.

const ORG_PREFIX = "sdn_live_";
const MUNICIPALITY_PREFIX = "sdn_muni_";
export type ApiKeyScope = "organization" | "municipality";

/** A fresh scoped token with 48 random hex characters. */
export function generateKey(scope: ApiKeyScope = "organization"): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return (scope === "municipality" ? MUNICIPALITY_PREFIX : ORG_PREFIX) + hex;
}

/** sha-256 hex of the token — what we persist and match against. */
export async function hashKey(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Display-only fragment, e.g. `sdn_live_ab12…`. */
export function keyPrefix(token: string): string {
  const prefixLength = token.startsWith(MUNICIPALITY_PREFIX) ? MUNICIPALITY_PREFIX.length : ORG_PREFIX.length;
  return token.slice(0, prefixLength + 4) + "…";
}

export function isKeyShape(token: string, scope?: ApiKeyScope): boolean {
  const prefix = scope === "municipality" ? MUNICIPALITY_PREFIX : scope === "organization" ? ORG_PREFIX : null;
  return prefix ? token.startsWith(prefix) : token.startsWith(ORG_PREFIX) || token.startsWith(MUNICIPALITY_PREFIX);
}
