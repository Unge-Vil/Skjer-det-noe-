import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.redirect("https://unge-vil.gitbook.io/skjer-det-noe/api-reference/", 308);
}