import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { addAuthorizationResponse, parseAuthorizationRequest } from "@/lib/mcp/oauthServer";
import { newSecret, secretHash, tokenLifetime } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

/** Opens the authenticated consent page; code issuance happens only on POST. */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL(`/oauth/authorize${new URL(request.url).search}`, request.url));
}

export async function POST(request: Request) {
  const form = await request.formData();
  const params = new URLSearchParams();
  for (const [key, value] of form.entries()) if (typeof value === "string") params.set(key, value);
  const authorization = await parseAuthorizationRequest(params, request);
  if ("error" in authorization) return NextResponse.json({ error: "invalid_request", error_description: authorization.error }, { status: 400 });

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });
  const code = newSecret("sdn_mcp_code_");
  const { error } = await createAdminClient().from("mcp_oauth_codes").insert({
    code_hash: await secretHash(code), client_id: authorization.clientId, user_id: user.id,
    redirect_uri: authorization.redirectUri, code_challenge: authorization.codeChallenge,
    scopes: authorization.scopes, resource: authorization.resource, expires_at: tokenLifetime("code"),
  });
  if (error) return NextResponse.json({ error: "server_error" }, { status: 500 });
  return NextResponse.redirect(addAuthorizationResponse(authorization.redirectUri, { code, state: authorization.state }));
}