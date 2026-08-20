import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { fetchEmbedConfig } from "@/lib/embeds";

const EMBED_PATH = /^\/embed\/([A-Za-z0-9_-]{8,32})(\/|$)/;

export async function proxy(request: NextRequest) {
  const match = EMBED_PATH.exec(request.nextUrl.pathname);
  if (match) return embedResponse(request, match[1]);
  return updateSession(request);
}

/**
 * Embeds render anonymously (no session refresh) and are framed by third
 * parties, so the only guard is frame-ancestors from the owner's allow list.
 */
async function embedResponse(request: NextRequest, publicId: string) {
  const embed = await fetchEmbedConfig(publicId);
  const headers = new Headers(request.headers);
  headers.set("x-sdn-embed", "1");
  headers.set("x-sdn-embed-theme", embed?.theme ?? "auto");

  const response = NextResponse.next({ request: { headers } });
  // On lookup failure we fall back to "*": embed data is public and cookie-free,
  // so a transient error should not black out a customer's website.
  // 'self' keeps the admin preview working when the allow list is restricted.
  const origins = embed?.allowed_origins?.length ? `'self' ${embed.allowed_origins.join(" ")}` : "*";
  response.headers.set("Content-Security-Policy", `frame-ancestors ${origins}`);
  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};