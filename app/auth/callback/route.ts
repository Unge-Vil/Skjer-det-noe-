import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const isRecovery = url.searchParams.get("type") === "recovery";
  const destination = new URL(isRecovery ? "/oppdater-passord" : "/logg-inn", url.origin);

  if (!code) {
    destination.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(destination);
  }

  const { error } = await (await createClient()).auth.exchangeCodeForSession(code);
  if (error) {
    destination.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(destination);
  }

  return NextResponse.redirect(destination);
}