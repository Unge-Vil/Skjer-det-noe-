// Isomorphic API-key helpers (Web Crypto — run in both the browser, when an org
// admin mints a key, and on the server, when a request is authenticated).
// The raw token is shown to the user once; only its sha-256 hash is stored.

const PREFIX = "sdn_live_";

/** A fresh token: `sdn_live_` + 48 hex chars. */
export function generateKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return PREFIX + hex;
}

/** sha-256 hex of the token — what we persist and match against. */
export async function hashKey(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Display-only fragment, e.g. `sdn_live_ab12…`. */
export function keyPrefix(token: string): string {
  return token.slice(0, PREFIX.length + 4) + "…";
}

export function isKeyShape(token: string): boolean {
  return token.startsWith(PREFIX);
}
