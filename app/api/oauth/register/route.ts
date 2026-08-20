import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSafeRedirectUri, newSecret } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

/** OAuth dynamic client registration for public MCP clients. */
export async function POST(request: Request) {
  let body: { client_name?: unknown; redirect_uris?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400 }); }
  const clientName = typeof body.client_name === "string" ? body.client_name.trim().slice(0, 120) : "MCP-klient";
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((value): value is string => typeof value === "string" && isSafeRedirectUri(value)) : [];
  if (!redirectUris.length || redirectUris.length > 10) return NextResponse.json({ error: "invalid_redirect_uri" }, { status: 400 });

  const clientId = newSecret("sdn_mcp_client_");
  const { error } = await createAdminClient().from("mcp_oauth_clients").insert({ client_id: clientId, client_name: clientName, redirect_uris: redirectUris });
  if (error) return NextResponse.json({ error: "server_error" }, { status: 500 });
  return NextResponse.json({ client_id: clientId, client_name: clientName, redirect_uris: redirectUris, token_endpoint_auth_method: "none" }, { status: 201 });
}