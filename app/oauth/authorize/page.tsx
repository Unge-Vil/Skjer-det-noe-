import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function OAuthAuthorizePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (typeof value === "string") query.set(key, value);
  const user = await getUser();
  if (!user) redirect(`/logg-inn?next=${encodeURIComponent(`/oauth/authorize?${query.toString()}`)}`);

  const clientId = query.get("client_id") ?? "";
  const { data: client } = await createAdminClient().from("mcp_oauth_clients").select("client_name").eq("client_id", clientId).maybeSingle();
  if (!client) redirect("/logg-inn");
  const redirectUri = query.get("redirect_uri") ?? "";
  let redirectHost = redirectUri;
  try { redirectHost = new URL(redirectUri).host; } catch { /* POST validation rejects malformed URLs. */ }
  const requestedScopes = (query.get("scope") ?? "mcp:read").split(/\s+/).filter(Boolean).join(", ");

  return <main id="main" className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12"><section style={{ padding: 28, borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}><h1 style={{ margin: "0 0 8px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>Koble til {client.client_name as string}</h1><p style={{ margin: "0 0 16px", color: "var(--text-muted)", lineHeight: 1.6 }}>Denne appen får tilgang til MCP-verktøyene som rollen din tillater. Du kan koble fra igjen i AI-verktøyets innstillinger.</p><dl style={{ margin: "0 0 20px", padding: 14, background: "var(--surface-sunk)", borderRadius: "var(--radius-md)", fontSize: "var(--fs-sm)" }}><dt style={{ fontWeight: 700 }}>Returnerer til</dt><dd style={{ margin: "2px 0 12px" }}><code>{redirectHost}</code></dd><dt style={{ fontWeight: 700 }}>Forespurt tilgang</dt><dd style={{ margin: "2px 0 0" }}><code>{requestedScopes}</code></dd></dl><form action="/api/oauth/authorize" method="post">{[...query.entries()].map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}<button type="submit" style={{ minHeight: "var(--tap-comfy)", padding: "0 16px", border: 0, borderRadius: "var(--radius-md)", background: "var(--accent)", color: "var(--text-on-accent)", font: "inherit", fontWeight: 700, cursor: "pointer" }}>Godkjenn og koble til</button></form></section></main>;
}