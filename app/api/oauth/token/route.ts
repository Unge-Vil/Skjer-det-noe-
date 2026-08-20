import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mcpResourceUrl, newSecret, secretHash, tokenLifetime, validPkceVerifier } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const grantType = form.get("grant_type");
  if (grantType === "authorization_code") return exchangeCode(form, request);
  if (grantType === "refresh_token") return refreshToken(form, request);
  return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
}

async function exchangeCode(form: FormData, request: Request) {
  const code = text(form, "code");
  const clientId = text(form, "client_id");
  const redirectUri = text(form, "redirect_uri");
  const verifier = text(form, "code_verifier");
  const resource = text(form, "resource");
  if (!code || !clientId || !redirectUri || !verifier || resource !== mcpResourceUrl(request)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const admin = createAdminClient();
  const codeHash = await secretHash(code);
  const { data: record } = await admin.from("mcp_oauth_codes").select("client_id,user_id,redirect_uri,code_challenge,scopes,resource,expires_at,used_at").eq("code_hash", codeHash).maybeSingle();
  if (!record || record.used_at || new Date(record.expires_at as string) <= new Date() || record.client_id !== clientId || record.redirect_uri !== redirectUri || record.resource !== resource || !(await validPkceVerifier(verifier, record.code_challenge as string))) return NextResponse.json({ error: "invalid_grant" }, { status: 400 });

  const { data: used } = await admin.from("mcp_oauth_codes").update({ used_at: new Date().toISOString() }).eq("code_hash", codeHash).is("used_at", null).select("code_hash").maybeSingle();
  if (!used) return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  return issueTokens(record.user_id as string, clientId, record.scopes as string[], resource);
}

async function refreshToken(form: FormData, request: Request) {
  const refreshToken = text(form, "refresh_token");
  const clientId = text(form, "client_id");
  const resource = text(form, "resource");
  if (!refreshToken || !clientId || resource !== mcpResourceUrl(request)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const admin = createAdminClient();
  const tokenHash = await secretHash(refreshToken);
  const { data: record } = await admin.from("mcp_oauth_tokens").select("user_id,client_id,scopes,resource,family_id,expires_at,revoked_at").eq("token_hash", tokenHash).eq("token_type", "refresh").maybeSingle();
  if (!record || record.revoked_at || new Date(record.expires_at as string) <= new Date() || record.client_id !== clientId || record.resource !== resource) return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  const { data: revoked } = await admin.from("mcp_oauth_tokens").update({ revoked_at: new Date().toISOString(), last_used_at: new Date().toISOString() }).eq("token_hash", tokenHash).is("revoked_at", null).select("token_hash").maybeSingle();
  if (!revoked) return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  return issueTokens(record.user_id as string, clientId, record.scopes as string[], resource, record.family_id as string);
}

async function issueTokens(userId: string, clientId: string, scopes: string[], resource: string, familyId?: string) {
  const accessToken = newSecret("sdn_mcp_at_");
  const refreshToken = newSecret("sdn_mcp_rt_");
  const admin = createAdminClient();
  const accessHash = await secretHash(accessToken);
  const refreshHash = await secretHash(refreshToken);
  const family = familyId ?? crypto.randomUUID();
  const { error } = await admin.from("mcp_oauth_tokens").insert([
    { token_hash: accessHash, token_type: "access", family_id: family, client_id: clientId, user_id: userId, scopes, resource, expires_at: tokenLifetime("access") },
    { token_hash: refreshHash, token_type: "refresh", family_id: family, client_id: clientId, user_id: userId, scopes, resource, expires_at: tokenLifetime("refresh") },
  ]);
  if (error) return NextResponse.json({ error: "server_error" }, { status: 500 });
  return NextResponse.json({ access_token: accessToken, token_type: "Bearer", expires_in: 3600, refresh_token: refreshToken, scope: scopes.join(" ") });
}

function text(form: FormData, key: string): string | null {
  const value = form.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}