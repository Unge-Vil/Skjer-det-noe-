import { NextResponse } from "next/server";
import { lookupBrreg, normalizeOrgNumber } from "@/lib/brreg";

/** GET /api/brreg/:orgnr — look up an organisation in Brønnøysund. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgnr: string }> },
) {
  const { orgnr } = await params;

  if (!normalizeOrgNumber(orgnr)) {
    return NextResponse.json({ error: "invalid_org_number" }, { status: 400 });
  }

  try {
    const org = await lookupBrreg(orgnr);
    if (!org) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(org);
  } catch (err) {
    console.error("brreg lookup failed", err);
    return NextResponse.json({ error: "lookup_failed" }, { status: 502 });
  }
}
