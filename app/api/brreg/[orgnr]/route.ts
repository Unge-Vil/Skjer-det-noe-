import { NextResponse } from "next/server";
import { lookupBrreg, normalizeOrgNumber } from "@/lib/brreg";
import { clientIp, enforceRateLimit, limitKey } from "@/lib/rate-limit";

/** GET /api/brreg/:orgnr — look up an organisation in Brønnøysund. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgnr: string }> },
) {
  const limited = enforceRateLimit({
    bucket: "api_brreg_lookup",
    key: limitKey([clientIp(req)]),
    max: 20,
    windowMs: 60_000,
  });
  if (limited) return limited;

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
