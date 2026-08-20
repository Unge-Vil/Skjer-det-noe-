import { hashKey } from "@/lib/apiKeys";

const PRODUCTION_ORIGIN = "https://skjerdetnoe.no";
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const AUTHORIZATION_CODE_TTL_SECONDS = 5 * 60;
export const MCP_SCOPES = ["mcp:read", "mcp:write"] as const;

export function mcpResourceUrl(request?: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/mcp`;
  if (process.env.NODE_ENV === "production") return `${PRODUCTION_ORIGIN}/api/mcp`;
  return request ? `${new URL(request.url).origin}/api/mcp` : `${PRODUCTION_ORIGIN}/api/mcp`;
}

export function authorizationServerUrl(request?: Request): string {
  return mcpResourceUrl(request).replace(/\/api\/mcp$/, "");
}

export function newSecret(prefix: string): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `${prefix}${toBase64Url(bytes)}`;
}

export async function secretHash(value: string): Promise<string> {
  return hashKey(value);
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return toBase64Url(new Uint8Array(digest));
}

export async function validPkceVerifier(verifier: string, challenge: string): Promise<boolean> {
  if (verifier.length < 43 || verifier.length > 128) return false;
  return (await pkceChallenge(verifier)) === challenge;
}

export function expiresAt(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function tokenLifetime(type: "access" | "refresh" | "code"): string {
  return expiresAt(type === "access" ? ACCESS_TOKEN_TTL_SECONDS : type === "refresh" ? REFRESH_TOKEN_TTL_SECONDS : AUTHORIZATION_CODE_TTL_SECONDS);
}

export function isSafeRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    return !url.hash && !url.username && !url.password && (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)));
  } catch {
    return false;
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}